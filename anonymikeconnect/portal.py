"""Local splash page and optional DNS redirector for captive portal mode."""

from __future__ import annotations

import socketserver
import threading
from dataclasses import dataclass

from dnslib import A, DNSRecord, RR
from flask import Flask, redirect, render_template_string, request, url_for

from .database import VoucherStore
from .network import NetworkManager


PORTAL_TEMPLATE = """
<!doctype html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{ ssid }} access</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; }
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:#061c2c; color:#f5f9fc; }
    main { width:min(92vw,420px); padding:36px; border:1px solid #1d5272; border-radius:18px; background:#08263a; box-shadow:0 20px 60px #03111c99; }
    .brand { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
    .brand img { width:120px; height:58px; object-fit:contain; object-position:left center; }
    .mark { color:#48b2f4; font-size:12px; font-weight:800; letter-spacing:.18em; }
    h1 { margin:14px 0 8px; font-size:30px; }
    p { color:#a7bdca; line-height:1.5; }
    label { display:block; margin:26px 0 8px; font-size:12px; font-weight:700; color:#a7bdca; text-transform:uppercase; letter-spacing:.08em; }
    input,button { width:100%; box-sizing:border-box; border-radius:8px; padding:14px; font-size:16px; }
    input { color:#f5f9fc; background:#061c2c; border:1px solid #2a6381; }
    button { margin-top:18px; border:0; background:#1695e5; color:white; font-weight:800; cursor:pointer; }
    .error { margin-top:18px; color:#ff9f9f; }
    .ok { margin-top:18px; color:#8be6b4; }
  </style>
</head>
<body>
  <main>
    <div class="brand">
      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202026%2C%2001_08_15%20PM-h1DWAiZ5E3Y4SMk3A2I7AdYEu0dclb.png" alt="ANONYMIKECONNECT logo" onerror="this.style.display='none'">
      <div class="mark">ANONYMIKECONNECT</div>
    </div>
    <h1>Connect to {{ ssid }}</h1>
    <p>Enter the access voucher provided by your host to get online.</p>
    <form method="post" action="{{ url_for('login') }}">
      <label for="code">Access voucher</label>
      <input id="code" name="code" autocomplete="one-time-code" placeholder="ABCD-EFGH-IJKL" required>
      <button type="submit">Continue online</button>
    </form>
    {% if error %}<div class="error">{{ error }}</div>{% endif %}
    {% if success %}<div class="ok">{{ success }}</div>{% endif %}
  </main>
</body>
</html>
"""


class _DnsHandler(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        data, sock = self.request
        try:
            request = DNSRecord.parse(data)
        except Exception:
            return
        if not request.questions:
            return
        reply = request.reply()
        for question in request.questions:
            reply.add_answer(
                RR(
                    rname=question.qname,
                    rtype=question.qtype,
                    rclass=question.qclass,
                    ttl=30,
                    rdata=A(self.server.gateway_ip),  # type: ignore[attr-defined]
                )
            )
        sock.sendto(reply.pack(), self.client_address)


class _DnsServer(socketserver.ThreadingUDPServer):
    allow_reuse_address = True

    def __init__(self, gateway_ip: str, host: str = "0.0.0.0", port: int = 53) -> None:
        self.gateway_ip = gateway_ip
        super().__init__((host, port), _DnsHandler)


@dataclass
class PortalStatus:
    web_running: bool = False
    dns_running: bool = False
    message: str = "Portal stopped."


class CaptivePortal:
    def __init__(
        self,
        store: VoucherStore,
        network: NetworkManager,
        ssid: str,
        gateway_ip: str = "192.168.10.1",
        web_port: int = 8080,
    ) -> None:
        self.store = store
        self.network = network
        self.ssid = ssid
        self.gateway_ip = gateway_ip
        self.web_port = web_port
        self.status = PortalStatus()
        self._web_server = None
        self._web_thread: threading.Thread | None = None
        self._dns_server: _DnsServer | None = None
        self._dns_thread: threading.Thread | None = None
        self.app = self._create_app()

    def _create_app(self) -> Flask:
        app = Flask(__name__)

        @app.get("/")
        def index():
            return render_template_string(
                PORTAL_TEMPLATE, ssid=self.ssid, error=None, success=None
            )

        @app.post("/login")
        def login():
            code = request.form.get("code", "")
            client_ip = request.remote_addr or "0.0.0.0"
            client_mac = request.headers.get("X-Client-MAC", "unknown")
            valid, message = self.store.redeem(code, client_mac, client_ip)
            if valid:
                firewall = self.network.allow_client(client_ip, client_mac)
                if not firewall.ok:
                    message += " The desktop app could not add a Windows firewall rule."
                return render_template_string(
                    PORTAL_TEMPLATE, ssid=self.ssid, error=None, success=message
                )
            return render_template_string(
                PORTAL_TEMPLATE, ssid=self.ssid, error=message, success=None
            ), 401

        @app.get("/generate_204")
        @app.get("/hotspot-detect.html")
        @app.get("/connecttest.txt")
        def captive_probe():
            return redirect(url_for("index"))

        @app.get("/status")
        def status():
            return {"portal": "online", "ssid": self.ssid}

        return app

    def start(self, enable_dns: bool = True) -> PortalStatus:
        if self.status.web_running:
            return self.status
        from werkzeug.serving import make_server

        self._web_server = make_server(self.gateway_ip, self.web_port, self.app, threaded=True)
        self._web_thread = threading.Thread(
            target=self._web_server.serve_forever,
            name="anonymikeconnect-portal",
            daemon=True,
        )
        self._web_thread.start()
        self.status.web_running = True
        self.status.message = f"Portal available at http://{self.gateway_ip}:{self.web_port}"

        if enable_dns:
            try:
                self._dns_server = _DnsServer(self.gateway_ip)
                self._dns_thread = threading.Thread(
                    target=self._dns_server.serve_forever,
                    name="anonymikeconnect-dns",
                    daemon=True,
                )
                self._dns_thread.start()
                self.status.dns_running = True
            except OSError as exc:
                self.status.message += f" DNS redirector unavailable: {exc}"
        return self.status

    def stop(self) -> PortalStatus:
        if self._web_server is not None:
            self._web_server.shutdown()
            self._web_server.server_close()
            self._web_server = None
        if self._dns_server is not None:
            self._dns_server.shutdown()
            self._dns_server.server_close()
            self._dns_server = None
        self.status = PortalStatus(message="Portal stopped.")
        return self.status
