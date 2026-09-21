"""Windows Runtime tethering controller for ANONYMIKECONNECT."""

from __future__ import annotations

import json
import logging
import subprocess
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from typing import Any
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class HotspotConfig:
    version: str
    ssid_name: str
    auth_mode: str
    local_gateway_ip: str
    portal_redirect_url: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "HotspotConfig":
        required = ("version", "ssidName", "authMode", "localGatewayIp", "portalRedirectUrl")
        missing = [key for key in required if not str(payload.get(key, "")).strip()]
        if missing:
            raise ValueError(f"Missing hotspot metadata: {', '.join(missing)}")
        return cls(
            version=str(payload["version"]),
            ssid_name=str(payload["ssidName"]),
            auth_mode=str(payload["authMode"]),
            local_gateway_ip=str(payload["localGatewayIp"]),
            portal_redirect_url=str(payload["portalRedirectUrl"]),
        )


class HotspotController:
    """Fetch static release metadata and control Windows Mobile Hotspot."""

    PRODUCTION_CONFIG_URL = "https://vercel.app/release.json"
    DEFAULT_CONFIG = {
        "version": "1.0.0",
        "ssidName": "T.S COREBAND",
        "authMode": "OPEN_CAPTIVE",
        "localGatewayIp": "192.168.10.1",
        "portalRedirectUrl": "https://vercel.app",
    }


    def __init__(self, config_url: str | None = None, metadata_url: str | None = None) -> None:
        # Keep production as the safe default while allowing local test fixtures.
        self.config_url = config_url or metadata_url or self.PRODUCTION_CONFIG_URL
        self.metadata_url = self.config_url
        self.config: HotspotConfig | None = None
        self._running = False

    def fetch_config(self) -> HotspotConfig:
        try:
            request = Request(self.metadata_url, headers={"Accept": "application/json"})
            with urlopen(request, timeout=8) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("Hotspot metadata must be a JSON object")
            self.config = HotspotConfig.from_payload(payload)
            return self.config
        except (HTTPError, URLError, TimeoutError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            logging.getLogger(__name__).warning(
                "Remote release metadata unavailable (%s); using local default configuration.", exc
            )
            self.config = HotspotConfig.from_payload(self.DEFAULT_CONFIG)
            return self.config

    def _run_powershell(self, script: str) -> str:
        completed = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        output = (completed.stdout or "").strip()
        error = (completed.stderr or "").strip()
        if completed.returncode != 0:
            raise RuntimeError(error or output or f"PowerShell exited with code {completed.returncode}")
        return output

    def start(self, config: HotspotConfig | None = None) -> None:
        config = config or self.config or self.fetch_config()
        # The WinRT API currently requires a passphrase for Wi-Fi tethering on
        # supported Windows builds. Keep the requested empty value explicit;
        # Windows may reject it, in which case the caller receives that error.
        ssid = json.dumps(config.ssid_name)
        script = f"""
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$managerType = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows, ContentType = WindowsRuntime]
$profile = $managerType::CreateFromConnectionProfile([Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile())
if ($null -eq $profile) {{ throw 'No active internet connection profile was found.' }}
$config = $profile.GetCurrentAccessPointConfiguration()
$config.Ssid = {ssid}
$config.Passphrase = ''
$configure = $managerType::ConfigureAccessPointAsync($profile, $config)
$configure.AsTask().GetAwaiter().GetResult()
$start = $managerType::StartTetheringAsync($profile)
$result = $start.AsTask().GetAwaiter().GetResult()
if ($result.Status -notin @('Success', 'AlreadyOn')) {{ throw "Tethering failed: $($result.Status)" }}
$result.Status
"""
        self._run_powershell(script)
        self._running = True

    def stop(self) -> None:
        if not self._running:
            return
        script = """
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$managerType = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows, ContentType = WindowsRuntime]
$profile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
if ($null -ne $profile) {
  $stop = $managerType::StopTetheringAsync($profile)
  $result = $stop.AsTask().GetAwaiter().GetResult()
  $result.Status
}
"""
        try:
            self._run_powershell(script)
        finally:
            self._running = False

    @property
    def running(self) -> bool:
        return self._running


__all__ = ["HotspotConfig", "HotspotController"]
