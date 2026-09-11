"""Windows networking helpers used by the desktop application.

The legacy hosted-network commands are still available on many Windows 10/11
drivers, but not all. Every command is surfaced to the caller so the UI can
explain when a driver or administrator permission prevents an operation.
"""

from __future__ import annotations

import base64
import json
import platform
import re
import subprocess
from dataclasses import dataclass


# Shared PowerShell preamble that loads the WinRT tethering APIs and provides a
# synchronous `Await` helper for the IAsyncOperation results they return. Used
# by the Windows Mobile Hotspot fallback when the legacy Hosted Network API is
# unavailable on the current Wi-Fi driver.
_WINRT_PREAMBLE = """
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $resultType) {
  $asTask = $asTaskGeneric.MakeGenericMethod($resultType)
  $task = $asTask.Invoke($null, @($op))
  $task.Wait(-1) | Out-Null
  $task.Result
}
[Windows.Networking.NetworkOperator.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperator,ContentType=WindowsRuntime] | Out-Null
[Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime] | Out-Null
"""

# Windows Mobile Hotspot always assigns this gateway/subnet to the host and
# shares the active internet connection automatically.
MOBILE_HOTSPOT_GATEWAY = "192.168.137.1"


@dataclass(frozen=True)
class Adapter:
    name: str
    description: str
    status: str
    mac_address: str = ""
    index: str = ""

    @property
    def label(self) -> str:
        return self.name if self.name == self.description else f"{self.name} — {self.description}"


@dataclass(frozen=True)
class CommandResult:
    ok: bool
    output: str
    error: str = ""


class NetworkManager:
    """Best-effort Windows adapter and hosted-network controller."""

    def __init__(self, gateway_ip: str = "192.168.10.1") -> None:
        self.gateway_ip = gateway_ip
        self.is_windows = platform.system() == "Windows"
        self.active = False
        self.mode: str | None = None
        self.last_message = ""

    def _run(
        self, command: list[str], *, powershell: bool = False, timeout: int = 20
    ) -> CommandResult:
        if not self.is_windows:
            return CommandResult(False, "", "Windows networking is only available on Windows.")

        executable = command
        if powershell:
            executable = [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                " ".join(command),
            ]
        try:
            completed = subprocess.run(
                executable,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            return CommandResult(False, "", str(exc))
        output = (completed.stdout or "").strip()
        error = (completed.stderr or "").strip()
        return CommandResult(completed.returncode == 0, output, error)

    def _run_script(self, script: str, *, timeout: int = 45) -> CommandResult:
        """Run a full PowerShell script via -EncodedCommand.

        Base64/UTF-16LE encoding avoids all quoting and newline pitfalls, which
        matters for the multi-line WinRT tethering scripts below.
        """
        if not self.is_windows:
            return CommandResult(False, "", "Windows networking is only available on Windows.")
        encoded = base64.b64encode(script.encode("utf-16-le")).decode("ascii")
        executable = [
            "powershell.exe",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-EncodedCommand",
            encoded,
        ]
        try:
            completed = subprocess.run(
                executable,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            return CommandResult(False, "", str(exc))
        output = (completed.stdout or "").strip()
        error = (completed.stderr or "").strip()
        return CommandResult(completed.returncode == 0, output, error)

    def list_adapters(self) -> list[Adapter]:
        """Return physical adapters plus virtual Wi-Fi adapters when available."""
        if not self.is_windows:
            return [
                Adapter("Ethernet", "Demo Ethernet adapter", "Unknown"),
                Adapter("Wi-Fi", "Demo Wi-Fi adapter", "Unknown"),
            ]

        script = (
            "Get-NetAdapter | "
            "Select-Object Name,InterfaceDescription,Status,MacAddress,ifIndex | "
            "ConvertTo-Json -Compress"
        )
        result = self._run([script], powershell=True)
        if result.ok and result.output:
            try:
                records = json.loads(result.output)
                if isinstance(records, dict):
                    records = [records]
                return [
                    Adapter(
                        name=str(record.get("Name", "")),
                        description=str(record.get("InterfaceDescription", "")),
                        status=str(record.get("Status", "")),
                        mac_address=str(record.get("MacAddress", "")),
                        index=str(record.get("ifIndex", "")),
                    )
                    for record in records
                    if record.get("Name")
                ]
            except (json.JSONDecodeError, TypeError):
                pass

        fallback = self._run(["netsh", "interface", "show", "interface"])
        adapters: list[Adapter] = []
        for line in fallback.output.splitlines():
            match = re.match(r"\s*(Enabled|Disabled)\s+(Connected|Disconnected)\s+\S+\s+(.+?)\s*$", line)
            if match:
                adapters.append(Adapter(match.group(3), match.group(3), match.group(2)))
        return adapters

    def hosted_network_supported(self) -> bool:
        if not self.is_windows:
            return False
        result = self._run(["netsh", "wlan", "show", "drivers"])
        return "Hosted network supported" in result.output and re.search(
            r"Hosted network supported\s*:\s*Yes", result.output, re.IGNORECASE
        ) is not None

    def start_hotspot(
        self,
        internet_adapter: str,
        wifi_adapter: str,
        ssid: str,
        password: str,
    ) -> CommandResult:
        if len(password) < 8:
            return CommandResult(False, "", "The network key must contain at least 8 characters.")
        if not ssid.strip():
            return CommandResult(False, "", "Enter a network name before starting the hotspot.")
        if self.is_windows and not self.hosted_network_supported():
            # Modern Wi-Fi drivers no longer expose the legacy Hosted Network
            # API. Fall back to the Windows Mobile Hotspot (WinRT tethering),
            # which most current drivers support and which shares the active
            # internet connection automatically (no manual ICS step needed).
            return self._start_via_mobile_hotspot(ssid.strip(), password)

        configure = self._run(
            ["netsh", "wlan", "set", "hostednetwork", "mode=allow", f"ssid={ssid.strip()}", f"key={password}"]
        )
        if not configure.ok:
            return configure
        started = self._run(["netsh", "wlan", "start", "hostednetwork"])
        if not started.ok:
            return started

        sharing = self.enable_internet_sharing(internet_adapter, wifi_adapter)
        self.active = True
        self.mode = "hostednetwork"
        if sharing.ok:
            self.last_message = "Hotspot started and internet sharing enabled."
            return CommandResult(True, f"{started.output}\n{sharing.output}".strip())
        self.last_message = "Hotspot started. Internet sharing needs Windows permission."
        return CommandResult(
            True,
            started.output,
            f"Hotspot is running, but internet sharing could not be enabled: {sharing.error or sharing.output}",
        )

    def stop_hotspot(self, internet_adapter: str = "", wifi_adapter: str = "") -> CommandResult:
        if self.mode == "mobilehotspot":
            stopped = self.stop_mobile_hotspot()
            self.active = False
            self.mode = None
            self.last_message = "Hotspot stopped." if stopped.ok else (stopped.error or "Hotspot stopped.")
            return stopped
        stopped = self._run(["netsh", "wlan", "stop", "hostednetwork"])
        self.disable_internet_sharing(internet_adapter, wifi_adapter)
        self.active = False
        self.mode = None
        self.last_message = "Hotspot stopped."
        return stopped

    def _start_via_mobile_hotspot(self, ssid: str, password: str) -> CommandResult:
        result = self.start_mobile_hotspot(ssid, password)
        if not result.ok:
            return result
        self.active = True
        self.mode = "mobilehotspot"
        self.gateway_ip = MOBILE_HOTSPOT_GATEWAY
        self.last_message = (
            f"Hotspot started with Windows Mobile Hotspot (gateway {MOBILE_HOTSPOT_GATEWAY})."
        )
        return CommandResult(
            True,
            result.output,
            "Started with Windows Mobile Hotspot. Windows handles internet sharing; "
            f"the captive portal now uses gateway {MOBILE_HOTSPOT_GATEWAY}.",
        )

    def mobile_hotspot_supported(self) -> bool:
        """Best-effort check that the WinRT tethering manager can be created."""
        if not self.is_windows:
            return False
        script = _WINRT_PREAMBLE + (
            "$p = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile();"
            "if ($null -eq $p) { Write-Output 'NOPROFILE'; exit 0 };"
            "[Windows.Networking.NetworkOperator.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($p) | Out-Null;"
            "Write-Output 'OK'"
        )
        result = self._run_script(script)
        return result.ok and "OK" in result.output

    def start_mobile_hotspot(self, ssid: str, password: str) -> CommandResult:
        if not self.is_windows:
            return CommandResult(False, "", "Windows Mobile Hotspot is only available on Windows.")
        safe_ssid = ssid.replace("'", "''")
        safe_pass = password.replace("'", "''")
        script = _WINRT_PREAMBLE + (
            "$profile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()\n"
            "if ($null -eq $profile) { throw 'No active internet connection was found to share. Connect this PC to the internet first.' }\n"
            "$manager = [Windows.Networking.NetworkOperator.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($profile)\n"
            "$config = $manager.GetCurrentAccessPointConfiguration()\n"
            f"$config.Ssid = '{safe_ssid}'\n"
            f"$config.Passphrase = '{safe_pass}'\n"
            "$resultType = [Windows.Networking.NetworkOperator.NetworkOperatorTetheringOperationResult]\n"
            "Await ($manager.ConfigureAccessPointAsync($config)) $resultType | Out-Null\n"
            "if ($manager.TetheringOperationalState -eq 1) { Write-Output 'STATUS:Success'; exit 0 }\n"
            "$result = Await ($manager.StartTetheringAsync()) $resultType\n"
            "Write-Output ('STATUS:' + $result.Status)\n"
        )
        return self._interpret_tethering(self._run_script(script), "start")

    def stop_mobile_hotspot(self) -> CommandResult:
        if not self.is_windows:
            return CommandResult(True, "")
        script = _WINRT_PREAMBLE + (
            "$profile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()\n"
            "if ($null -eq $profile) { Write-Output 'STATUS:Success'; exit 0 }\n"
            "$manager = [Windows.Networking.NetworkOperator.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($profile)\n"
            "if ($manager.TetheringOperationalState -eq 2) { Write-Output 'STATUS:Success'; exit 0 }\n"
            "$result = Await ($manager.StopTetheringAsync()) ([Windows.Networking.NetworkOperator.NetworkOperatorTetheringOperationResult])\n"
            "Write-Output ('STATUS:' + $result.Status)\n"
        )
        return self._interpret_tethering(self._run_script(script), "stop")

    def _interpret_tethering(self, outcome: CommandResult, action: str) -> CommandResult:
        if "STATUS:Success" in outcome.output or "STATUS:0" in outcome.output:
            return CommandResult(True, outcome.output)
        combined = "\n".join(part for part in (outcome.output, outcome.error) if part).strip()
        hint = self._tethering_hint(combined)
        return CommandResult(
            False,
            "",
            hint or combined or f"Windows Mobile Hotspot could not {action} the hotspot.",
        )

    @staticmethod
    def _tethering_hint(text: str) -> str:
        lowered = text.lower()
        if "wifideviceoff" in lowered or "status:3" in lowered:
            return "Turn on this PC's Wi-Fi adapter, then start the hotspot again."
        if "mobilebroadbanddeviceoff" in lowered or "status:2" in lowered:
            return "The mobile broadband device is off. Enable it and try again."
        if "no active internet connection" in lowered:
            return "Connect this PC to the internet first, then start the hotspot again."
        if "operationinprogress" in lowered or "status:4" in lowered:
            return "Windows is still changing the hotspot state. Wait a moment and try again."
        return ""

    def enable_internet_sharing(self, source_name: str, target_name: str) -> CommandResult:
        if not self.is_windows:
            return CommandResult(False, "", "Windows Internet Connection Sharing is unavailable here.")
        escaped_source = source_name.replace("'", "''")
        escaped_target = target_name.replace("'", "''")
        script = (
            "$share=New-Object -ComObject HNetCfg.HNetShare;"
            "$src=$null;$dst=$null;"
            "foreach($c in $share.EnumEveryConnection()){"
            "$p=$share.NetConnectionProps($c);"
            f"if($p.Name -eq '{escaped_source}'){{$src=$c}};"
            f"if($p.Name -eq '{escaped_target}'){{$dst=$c}}"
            "};"
            "if($null -eq $src -or $null -eq $dst){throw 'Adapter names were not found by Internet Connection Sharing'};"
            "$share.INetSharingConfigurationForINetConnection($src).EnableSharing(0);"
            "$share.INetSharingConfigurationForINetConnection($dst).EnableSharing(1);"
        )
        return self._run([script], powershell=True)

    def disable_internet_sharing(self, source_name: str, target_name: str) -> CommandResult:
        if not self.is_windows or not source_name or not target_name:
            return CommandResult(True, "")
        escaped = [source_name.replace("'", "''"), target_name.replace("'", "''")]
        script = (
            "$share=New-Object -ComObject HNetCfg.HNetShare;"
            "foreach($c in $share.EnumEveryConnection()){"
            "$p=$share.NetConnectionProps($c);"
            f"if($p.Name -eq '{escaped[0]}' -or $p.Name -eq '{escaped[1]}')"
            "{$share.INetSharingConfigurationForINetConnection($c).DisableSharing()}"
            "}"
        )
        return self._run([script], powershell=True)

    def connected_clients(self) -> list[dict[str, str]]:
        """Read the local ARP cache; richer DHCP leases are adapter-specific."""
        if not self.is_windows:
            return []
        result = self._run(["arp", "-a"])
        clients: list[dict[str, str]] = []
        for line in result.output.splitlines():
            match = re.search(
                r"^\s*(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f-]{17})\s+(\w+)",
                line,
                re.IGNORECASE,
            )
            if match:
                clients.append(
                    {
                        "hostname": "Unknown device",
                        "ip": match.group(1),
                        "mac": match.group(2).upper(),
                        "connection_time": "Detected now",
                    }
                )
        return clients

    def allow_client(self, client_ip: str, client_mac: str) -> CommandResult:
        """Add a narrow inbound firewall allow rule for a redeemed client.

        This is intentionally separate from the voucher database: a deployment
        can replace it with a stronger gateway/firewall integration.
        """
        if not self.is_windows:
            return CommandResult(False, "", "Firewall rules can only be applied on Windows.")
        safe_mac = re.sub(r"[^0-9A-Fa-f:-]", "", client_mac)
        safe_ip = re.sub(r"[^0-9.]", "", client_ip)
        rule_name = f"ANONYMIKECONNECT voucher {safe_mac or safe_ip}"
        return self._run(
            [
                "netsh",
                "advfirewall",
                "firewall",
                "add",
                "rule",
                f"name={rule_name}",
                "dir=in",
                "action=allow",
                f"remoteip={safe_ip}",
            ]
        )
