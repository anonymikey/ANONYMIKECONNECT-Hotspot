# ANONYMIKECONNECT

ANONYMIKECONNECT is a local Windows hotspot manager with a dark desktop interface, voucher-based guest access, a Flask splash page, and a local SQLite database.

## What is included

- `main.py` — customtkinter desktop application.
- `network.py` — adapter discovery, `netsh` Hosted Network control, Windows Internet Connection Sharing, ARP client discovery, and per-client firewall rules.
- `portal.py` — local Flask captive portal plus an optional DNS redirector.
- `database.py` — thread-safe SQLite voucher and session storage.
- `requirements.txt` — Python dependencies for Windows.

## Run on Windows

1. Install Python 3.11 or newer.
2. Open **PowerShell as Administrator**. Hosted Network, Internet Connection Sharing, and DNS port 53 require elevated privileges.
3. Create and activate a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Start the application from the repository root:

   ```powershell
   python -m anonymikeconnect.main
   ```

5. Select the upstream internet adapter and the Wi-Fi adapter that should broadcast the network. Set the SSID and password, then select **Start Hotspot**.

## Compile an `.exe`

From the activated environment, build through the package-safe launcher:

```powershell
pyinstaller --noconfirm --clean --windowed `
  --name ANONYMIKECONNECT `
  --add-data "anonymikeconnect;anonymikeconnect" `
  anonymikeconnect/run_anonymikeconnect.py
```

The executable is written to `dist/ANONYMIKECONNECT/ANONYMIKECONNECT.exe`.
## Windows networking notes

- The app checks `netsh wlan show drivers` before attempting the legacy Hosted Network flow. Some current Wi-Fi drivers report Hosted Network as unsupported even though Windows Mobile Hotspot works.
- Internet Connection Sharing is configured through the Windows `HNetCfg.HNetShare` COM API. Windows may show a permission or adapter-name error if the adapters are not connected or are already managed by another sharing tool.
- The DNS redirector binds to UDP port 53. Only one DNS service can bind that port. If it is unavailable, the Flask portal still runs and the app explains the issue.
- A captive portal is not a security boundary. Voucher enforcement should be paired with the Windows firewall and a properly configured gateway for production or public deployments.
- The application is local-first: no cloud service, analytics, or external API is required.