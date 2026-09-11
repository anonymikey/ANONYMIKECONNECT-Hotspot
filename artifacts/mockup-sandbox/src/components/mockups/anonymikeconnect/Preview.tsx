import { useMemo, useState } from "react";
import {
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Globe2,
  Menu,
  MonitorSmartphone,
  QrCode,
  RefreshCw,
  Router,
  Settings2,
  ShieldCheck,
  Ticket,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

type Page = "WLAN Hotspot" | "Connected Clients" | "Voucher Manager" | "Settings";

const navItems: Array<{ label: Page; icon: typeof Wifi }> = [
  { label: "WLAN Hotspot", icon: Wifi },
  { label: "Connected Clients", icon: Users },
  { label: "Voucher Manager", icon: Ticket },
  { label: "Settings", icon: Settings2 },
];

const clients = [
  { device: "Android-S25-Ultra", ip: "192.168.10.24", mac: "32-56-C6-8B-99-9D", time: "09:42:18" },
  { device: "MacBook-Air", ip: "192.168.10.25", mac: "AC-3B-77-21-04-6E", time: "09:39:04" },
  { device: "Pixel-8-Pro", ip: "192.168.10.26", mac: "6A-11-98-DF-5C-72", time: "09:31:42" },
];

const voucherRows = [
  { code: "7F2K-9QMV-L4P8", created: "Today, 09:42", expires: "Today, 10:42", status: "Active" },
  { code: "N8J3-RS61-2TXA", created: "Today, 09:36", expires: "Today, 13:36", status: "Active" },
  { code: "G5DP-44LK-QW2M", created: "Yesterday, 18:20", expires: "Expired", status: "Used" },
  { code: "U7MX-8PZC-3HQA", created: "Yesterday, 16:05", expires: "Expired", status: "Expired" },
];

const styles = {
  shell: {
    "--bg": "#061c2c",
    "--panel": "#0a2638",
    "--panel-2": "#0e344b",
    "--border": "#1b536f",
    "--muted": "#88a8b9",
    "--blue": "#25a5ef",
    "--blue-2": "#4ab9f7",
    "--green": "#88d44f",
    minHeight: "100vh",
    display: "flex",
    background: "#061c2c",
    color: "#eef7fb",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  } as React.CSSProperties,
  sidebar: {
    width: 242,
    flexShrink: 0,
    background: "#082a3f",
    borderRight: "1px solid #113e57",
    display: "flex",
    flexDirection: "column",
    padding: "26px 14px 18px",
  } as React.CSSProperties,
  content: {
    flex: 1,
    minWidth: 0,
    padding: "28px 34px 30px",
    overflow: "auto",
  } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;

function Field({
  label,
  value,
  onChange,
  type = "text",
  action,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  action?: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", color: "#8aaabd", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", marginBottom: 8 }}>
        {label.toUpperCase()}
      </span>
      <span style={{ position: "relative", display: "block" }}>
        <input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          type={type}
          style={{
            width: "100%",
            boxSizing: "border-box",
            height: 42,
            borderRadius: 7,
            border: "1px solid #2c6582",
            background: "#071f30",
            color: "#eef7fb",
            padding: action ? "0 48px 0 13px" : "0 13px",
            outline: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        />
        {action}
      </span>
    </label>
  );
}

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", color: "#8aaabd", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", marginBottom: 8 }}>
        {label.toUpperCase()}
      </span>
      <span style={{ height: 42, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 7, border: "1px solid #2c6582", background: "#071f30", padding: "0 12px 0 13px", color: "#e8f3f7", fontSize: 13, fontWeight: 600 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#4ac76a", boxShadow: "0 0 10px #4ac76a88" }} />
          {value}
        </span>
        <ChevronDown size={16} color="#8aaabd" />
      </span>
    </label>
  );
}

export function Preview() {
  const [page, setPage] = useState<Page>("WLAN Hotspot");
  const [active, setActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("12345678");
  const [ssid, setSsid] = useState("ANONYMIKECONNECT");
  const [showQr, setShowQr] = useState(false);
  const [vouchers, setVouchers] = useState(voucherRows);

  const statusText = active ? "Hotspot is running" : "Hotspot is stopped";
  const connectionPayload = useMemo(() => `WIFI:T:WPA;S:${ssid};P:${password};;`, [password, ssid]);

  function generateVoucher() {
    const code = Math.random().toString(36).slice(2, 14).toUpperCase().replace(/(.{4})/g, "$1-").slice(0, 14);
    setVouchers((current) => [{ code, created: "Just now", expires: "In 1 hour", status: "Active" }, ...current]);
    setPage("Voucher Manager");
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={{ padding: "0 14px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#f7fbfd", fontWeight: 900, letterSpacing: "0.03em", fontSize: 19 }}>
            <span style={{ width: 27, height: 27, display: "grid", placeItems: "center", background: "#1b9ce8", borderRadius: 7 }}>
              <Zap size={15} fill="currentColor" />
            </span>
            ANONYMIKE
          </div>
          <div style={{ color: "#62bff0", fontSize: 10, letterSpacing: "0.2em", fontWeight: 800, margin: "7px 0 0 36px" }}>CONNECT</div>
        </div>
        <div style={{ color: "#6593a8", letterSpacing: "0.14em", fontSize: 10, fontWeight: 800, padding: "0 14px 10px" }}>CONTROL PANEL</div>
        <nav style={{ display: "grid", gap: 5 }}>
          {navItems.map(({ label, icon: Icon }) => {
            const selected = page === label;
            return (
              <button
                key={label}
                onClick={() => setPage(label)}
                style={{
                  border: 0,
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "0 14px",
                  borderRadius: 8,
                  background: selected ? "#124e6c" : "transparent",
                  boxShadow: selected ? "inset 3px 0 #42b5f3" : "none",
                  color: selected ? "#fff" : "#a9c4cf",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Icon size={18} strokeWidth={selected ? 2.4 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid #16445c", padding: "18px 14px 0", color: "#5c879a", fontSize: 10, lineHeight: 1.6 }}>
          <div style={{ color: "#8fb0be", fontWeight: 800 }}>LOCAL ONLY</div>
          <div>v0.1.0  •  Windows desktop</div>
        </div>
      </aside>

      <main style={styles.content}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ color: "#54b9ef", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em" }}>ANONYMIKECONNECT / {page.toUpperCase()}</div>
            <h1 style={{ margin: "8px 0 5px", fontSize: 29, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              {page === "WLAN Hotspot" ? "WLAN Hotspot" : page}
            </h1>
            <p style={{ margin: 0, color: "#89a7b6", fontSize: 13 }}>
              {page === "WLAN Hotspot" && "Share an internet connection and control guest access from this computer."}
              {page === "Connected Clients" && "Devices currently visible on the hotspot gateway."}
              {page === "Voucher Manager" && "Create time-limited access codes for the captive portal."}
              {page === "Settings" && "Local defaults and operational notes for Windows deployment."}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: active ? "#9de46f" : "#8095a0", fontSize: 12, fontWeight: 700, paddingTop: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: active ? "#8bd44f" : "#657985", boxShadow: active ? "0 0 0 4px #8bd44f20" : "none" }} />
            {active ? "SYSTEM READY" : "OFFLINE"}
          </div>
        </header>

        {page === "WLAN Hotspot" && (
          <>
            <section style={{ background: "#0a2638", border: "1px solid #123e55", borderRadius: 13, padding: 20, boxShadow: "0 15px 40px #00101a44" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 20 }}>
                <div style={{ width: 35, height: 35, display: "grid", placeItems: "center", borderRadius: 9, background: "#123e56", color: "#5cc0f7" }}><Router size={18} /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Network configuration</div>
                  <div style={{ color: "#789aaa", fontSize: 11, marginTop: 2 }}>Choose how this computer shares its connection.</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <SelectField label="Internet connection" value="Ethernet  •  192.168.1.121" />
                <SelectField label="Wi-Fi broadcast adapter" value="Wi-Fi Adapter  •  Ready" />
                <Field label="Network name (SSID)" value={ssid} onChange={setSsid} />
                <Field
                  label="Network key"
                  value={password}
                  onChange={setPassword}
                  type={showPassword ? "text" : "password"}
                  action={
                    <button onClick={() => setShowPassword((current) => !current)} style={{ position: "absolute", right: 5, top: 5, width: 34, height: 32, border: 0, background: "transparent", color: "#80a6b8", cursor: "pointer" }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>
            </section>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setActive((current) => !current)}
                style={{ flex: 1, height: 48, border: 0, borderRadius: 8, cursor: "pointer", background: active ? "#bd4c4c" : "#1c9ce9", color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: "0.04em", boxShadow: active ? "0 8px 20px #bd4c4c33" : "0 8px 20px #1c9ce933" }}
              >
                {active ? "STOP HOTSPOT" : "START HOTSPOT"}
              </button>
              <button onClick={() => setShowQr(true)} style={{ width: 92, height: 48, border: "1px solid #2d7296", borderRadius: 8, cursor: "pointer", background: "#103953", color: "#c5eaf8", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, fontWeight: 900 }}>
                <QrCode size={18} /> QR
              </button>
            </div>

            <section style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14 }}>
              <div style={{ background: "#0a2638", border: "1px solid #123e55", borderRadius: 13, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 11, height: 11, borderRadius: 99, background: active ? "#8bd44f" : "#6b7e87", boxShadow: active ? "0 0 0 6px #8bd44f20" : "none" }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{statusText}</div>
                  <div style={{ color: "#789aaa", fontSize: 11, marginTop: 4 }}>{active ? "Broadcasting securely on Wi-Fi Adapter" : "Choose adapters and start a local network."}</div>
                </div>
              </div>
              <div style={{ background: "#0a2638", border: "1px solid #123e55", borderRadius: 13, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ color: "#789aaa", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em" }}>GATEWAY</div><div style={{ marginTop: 5, fontSize: 14, fontWeight: 800 }}>192.168.10.1</div></div>
                <div><div style={{ color: "#789aaa", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em" }}>CLIENTS</div><div style={{ marginTop: 5, fontSize: 14, fontWeight: 800 }}>03</div></div>
              </div>
            </section>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
              {[
                { icon: Globe2, label: "Internet sharing", value: "Windows ICS enabled", color: "#50c6a7" },
                { icon: ShieldCheck, label: "Captive portal", value: "Listening on :8080", color: "#70b8f3" },
                { icon: MonitorSmartphone, label: "Guest access", value: "Voucher required", color: "#c39af7" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ border: "1px solid #123e55", background: "#0a2638", borderRadius: 11, padding: 15 }}>
                  <Icon size={17} color={color} />
                  <div style={{ marginTop: 12, color: "#87a6b6", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
                  <div style={{ marginTop: 5, color: "#dcecf2", fontSize: 12, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </section>
          </>
        )}

        {page === "Connected Clients" && (
          <section style={{ border: "1px solid #123e55", background: "#0a2638", borderRadius: 13, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Users size={18} color="#52baf0" /><span style={{ fontSize: 14, fontWeight: 800 }}>03 connected devices</span></div>
              <button style={{ display: "flex", gap: 7, alignItems: "center", border: "1px solid #255a74", borderRadius: 7, background: "#10364c", color: "#c0e3ef", padding: "8px 11px", fontSize: 11, fontWeight: 800 }}><RefreshCw size={14} /> REFRESH</button>
            </div>
            <div style={{ overflow: "hidden", border: "1px solid #16455d", borderRadius: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 0.8fr", padding: "12px 14px", background: "#10364c", color: "#6cb6d8", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em" }}>
                <div>HOSTNAME</div><div>IP ADDRESS</div><div>MAC ADDRESS</div><div>CONNECTED</div>
              </div>
              {clients.map((client) => (
                <div key={client.mac} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 0.8fr", padding: "17px 14px", borderTop: "1px solid #123e55", color: "#dcecf2", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 7, height: 7, background: "#8bd44f", borderRadius: 99 }} />{client.device}</div><div>{client.ip}</div><div style={{ color: "#94b4c2" }}>{client.mac}</div><div style={{ color: "#94b4c2" }}>{client.time}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === "Voucher Manager" && (
          <>
            <section style={{ border: "1px solid #123e55", background: "#0a2638", borderRadius: 13, padding: 17, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div><div style={{ fontSize: 14, fontWeight: 800 }}>Issue guest access</div><div style={{ color: "#789aaa", fontSize: 11, marginTop: 4 }}>Generate a time-limited code for the captive portal.</div></div>
              <div style={{ display: "flex", gap: 9 }}>
                <div style={{ padding: "10px 13px", borderRadius: 7, background: "#071f30", border: "1px solid #285e78", color: "#ddecf2", fontSize: 12, fontWeight: 700 }}>5 vouchers</div>
                <div style={{ padding: "10px 13px", borderRadius: 7, background: "#071f30", border: "1px solid #285e78", color: "#ddecf2", fontSize: 12, fontWeight: 700 }}>1 hour <ChevronDown size={13} style={{ verticalAlign: "middle", marginLeft: 8 }} /></div>
                <button onClick={generateVoucher} style={{ padding: "0 14px", border: 0, borderRadius: 7, background: "#1c9ce9", color: "#fff", fontSize: 11, fontWeight: 900 }}>GENERATE</button>
              </div>
            </section>
            <section style={{ marginTop: 14, border: "1px solid #123e55", background: "#0a2638", borderRadius: 13, padding: 16 }}>
              <div style={{ color: "#6cb6d8", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", padding: "2px 14px 12px", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr .7fr" }}><div>VOUCHER CODE</div><div>CREATED</div><div>EXPIRES</div><div>STATUS</div></div>
              {vouchers.map((voucher) => (
                <div key={voucher.code} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr .7fr", alignItems: "center", padding: "15px 14px", borderTop: "1px solid #123e55", fontSize: 12 }}>
                  <div style={{ color: "#e9f4f8", fontWeight: 800, letterSpacing: "0.08em" }}>{voucher.code}</div><div style={{ color: "#94b4c2" }}>{voucher.created}</div><div style={{ color: "#94b4c2" }}>{voucher.expires}</div><div><span style={{ display: "inline-flex", padding: "5px 8px", borderRadius: 99, background: voucher.status === "Active" ? "#244e3b" : "#27343b", color: voucher.status === "Active" ? "#9ee77b" : "#8ba0a9", fontSize: 10, fontWeight: 900 }}>{voucher.status.toUpperCase()}</span></div>
                </div>
              ))}
            </section>
          </>
        )}

        {page === "Settings" && (
          <section style={{ border: "1px solid #123e55", background: "#0a2638", borderRadius: 13, padding: 20 }}>
            {[
              ["DATABASE", "Local SQLite", "Voucher data is kept on this computer."],
              ["PORTAL", "Flask + DNS redirector", "The splash page listens on the local gateway."],
              ["HOTSPOT ENGINE", "netsh + Windows ICS", "Administrator access is required for network changes."],
            ].map(([label, value, note]) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "180px 260px 1fr", gap: 18, alignItems: "center", padding: "19px 0", borderBottom: "1px solid #123e55" }}>
                <div style={{ color: "#6cb6d8", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em" }}>{label}</div><div style={{ fontSize: 13, fontWeight: 800 }}>{value}</div><div style={{ color: "#789aaa", fontSize: 12 }}>{note}</div>
              </div>
            ))}
          </section>
        )}
      </main>

      {showQr && (
        <div onClick={() => setShowQr(false)} style={{ position: "fixed", inset: 0, background: "#02111bcc", display: "grid", placeItems: "center", zIndex: 4 }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: 330, padding: 25, border: "1px solid #2e7294", borderRadius: 15, background: "#0a2638", boxShadow: "0 20px 80px #00000088", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontWeight: 800 }}>Connect to hotspot</div><button onClick={() => setShowQr(false)} style={{ border: 0, background: "transparent", color: "#86a5b4", fontSize: 20 }}>×</button></div>
            <div style={{ width: 220, height: 220, margin: "0 auto", background: "#f3fbfd", borderRadius: 8, padding: 12, boxSizing: "border-box", display: "grid", placeItems: "center" }}>
              <div style={{ width: 180, height: 180, opacity: 0.8, backgroundImage: "linear-gradient(45deg, #062238 25%, transparent 25%), linear-gradient(-45deg, #062238 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #062238 75%), linear-gradient(-45deg, transparent 75%, #062238 75%)", backgroundSize: "24px 24px", backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px" }} />
            </div>
            <div style={{ marginTop: 15, color: "#eef7fb", fontSize: 16, fontWeight: 900 }}>{ssid}</div>
            <div style={{ marginTop: 6, color: "#789aaa", fontSize: 11 }}>Scan with a mobile device to join</div>
            <div style={{ marginTop: 13, color: "#537f93", fontSize: 9, wordBreak: "break-all" }}>{connectionPayload}</div>
          </div>
        </div>
      )}
    </div>
  );
}