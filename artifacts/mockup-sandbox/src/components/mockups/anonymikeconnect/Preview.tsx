import { useMemo, useState } from "react";
import {
  BarChart3,
  Ban,
  Cable,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  Globe2,
  KeyRound,
  ListFilter,
  Menu,
  MonitorSmartphone,
  Network,
  QrCode,
  RefreshCw,
  Router,
  Share2,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

type Page =
  | "WLAN Hotspot"
  | "Network Modes"
  | "Connected Clients"
  | "Bandwidth Manager"
  | "Firewall & Adblocker"
  | "URL Logs"
  | "Authentication"
  | "Voucher Manager"
  | "Port Forwarding"
  | "File Sharing"
  | "DHCP & NAT"
  | "Statistics"
  | "Settings";

const navItems: Array<{ label: Page; icon: typeof Wifi }> = [
  { label: "WLAN Hotspot", icon: Wifi },
  { label: "Network Modes", icon: Network },
  { label: "Connected Clients", icon: Users },
  { label: "Bandwidth Manager", icon: Gauge },
  { label: "Firewall & Adblocker", icon: Ban },
  { label: "URL Logs", icon: ListFilter },
  { label: "Authentication", icon: KeyRound },
  { label: "Voucher Manager", icon: Ticket },
  { label: "Port Forwarding", icon: Cable },
  { label: "File Sharing", icon: Share2 },
  { label: "DHCP & NAT", icon: SlidersHorizontal },
  { label: "Statistics", icon: BarChart3 },
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

function ToggleRow({ label, detail, enabled = true }: { label: string; detail: string; enabled?: boolean }) {
  const [checked, setChecked] = useState(enabled);
  return (
    <button onClick={() => setChecked((current) => !current)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", border: 0, borderBottom: "1px solid #123e55", background: "transparent", color: "#e8f4f8", textAlign: "left", cursor: "pointer" }}>
      <span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 800 }}>{label}</span>
        <span style={{ display: "block", marginTop: 4, color: "#789aaa", fontSize: 11 }}>{detail}</span>
      </span>
      <span style={{ width: 38, height: 21, flexShrink: 0, display: "flex", justifyContent: checked ? "flex-end" : "flex-start", alignItems: "center", padding: 3, boxSizing: "border-box", borderRadius: 99, background: checked ? "#1b9ce8" : "#274351", transition: "all .18s ease" }}>
        <span style={{ width: 15, height: 15, borderRadius: 99, background: "#eaf7fb", boxShadow: "0 1px 3px #00111c88" }} />
      </span>
    </button>
  );
}

function FeaturePage({ page }: { page: Page }) {
  const panel = { border: "1px solid #123e55", background: "#0a2638", borderRadius: 13, padding: 18 };
  const subheading = { color: "#6cb6d8", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em" };

  if (page === "Network Modes") {
    const modes = [
      ["Router Mode (NAT)", "Share Ethernet, Wi-Fi, or VPN through a managed gateway.", Router, true],
      ["Wi-Fi Repeater", "Extend an existing wireless network with a second adapter.", Wifi, false],
      ["Bridge Mode", "Connect clients directly to an external access point.", Cable, false],
      ["No Internet", "Create an isolated local network for device-to-device sharing.", Network, false],
    ] as const;
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <section style={panel}>
          <div style={{ ...subheading, marginBottom: 14 }}>NETWORK CONFIGURATION</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {modes.map(([name, detail, Icon, selected]) => (
              <button key={name} style={{ minHeight: 118, padding: 16, borderRadius: 10, border: selected ? "1px solid #35b0f2" : "1px solid #204d64", background: selected ? "#103f59" : "#071f30", color: "#eef7fb", textAlign: "left", cursor: "pointer", boxShadow: selected ? "inset 3px 0 #35b0f2" : "none" }}>
                <Icon size={19} color={selected ? "#5bc5fb" : "#86a7b6"} />
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 900 }}>{name}</div>
                <div style={{ marginTop: 5, color: "#789aaa", fontSize: 11, lineHeight: 1.45 }}>{detail}</div>
              </button>
            ))}
          </div>
        </section>
        <section style={{ ...panel, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {[["UPSTREAM", "Ethernet", "192.168.1.121"], ["GATEWAY", "Router", "192.168.10.1"], ["CLIENT POOL", "DHCP", "192.168.10.20 – 240"]].map(([label, value, detail]) => (
            <div key={label}><div style={subheading}>{label}</div><div style={{ marginTop: 7, fontSize: 14, fontWeight: 900 }}>{value}</div><div style={{ marginTop: 3, color: "#789aaa", fontSize: 11 }}>{detail}</div></div>
          ))}
        </section>
      </div>
    );
  }

  if (page === "Bandwidth Manager") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 14 }}>
        <section style={panel}>
          <div style={{ ...subheading, marginBottom: 10 }}>TOTAL BANDWIDTH</div>
          <div style={{ display: "flex", alignItems: "end", gap: 8, marginBottom: 18 }}><span style={{ fontSize: 34, fontWeight: 900 }}>100</span><span style={{ color: "#8aaabd", paddingBottom: 6, fontSize: 12 }}>Mbit/s available</span></div>
          <div style={{ height: 8, background: "#123e55", borderRadius: 99, overflow: "hidden" }}><div style={{ width: "63%", height: "100%", background: "linear-gradient(90deg, #1b9ce8, #77d2ff)", borderRadius: 99 }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "#789aaa", fontSize: 11 }}><span>63 Mbit/s in use</span><span>37 Mbit/s free</span></div>
          <div style={{ marginTop: 24 }}><ToggleRow label="Enable bandwidth manager" detail="Apply traffic policies to all hotspot clients." /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}><Field label="Default download" value="3 Mbit/s" /><Field label="Default upload" value="1 Mbit/s" /></div>
        </section>
        <section style={panel}>
          <div style={{ ...subheading, marginBottom: 12 }}>CLIENT POLICIES</div>
          {[
            ["Android-S25-Ultra", "3 / 1 Mbit/s", "42%"],
            ["MacBook-Air", "10 / 5 Mbit/s", "18%"],
            ["Pixel-8-Pro", "3 / 1 Mbit/s", "8%"],
          ].map(([name, speed, usage]) => (
            <div key={name} style={{ padding: "14px 0", borderBottom: "1px solid #123e55" }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800 }}><span>{name}</span><span style={{ color: "#70c8f5" }}>{usage}</span></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, color: "#789aaa", fontSize: 11 }}><span>{speed}</span><span>Individual policy</span></div></div>
          ))}
        </section>
      </div>
    );
  }

  if (page === "Firewall & Adblocker") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <section style={panel}><div style={{ ...subheading, marginBottom: 4 }}>NETWORK PROTECTION</div><ToggleRow label="Enable firewall" detail="Filter guest traffic before it reaches the internet." /><ToggleRow label="Block file sharing / P2P" detail="Block common peer-to-peer protocols." /><ToggleRow label="Block social networks" detail="Apply the social network blocklist to guests." /><ToggleRow label="Block local network access" detail="Keep public hotspot clients isolated." /></section>
        <section style={panel}><div style={{ ...subheading, marginBottom: 4 }}>ADBLOCKER & SERVICES</div><ToggleRow label="Ad and tracker filtering" detail="Reduce ads and tracking requests for all clients." /><ToggleRow label="Block UPnP discovery" detail="Prevent automatic device discovery on the hotspot." enabled={false} /><ToggleRow label="Allow internet access" detail="Disable this to run a local-only network." /><div style={{ marginTop: 16, padding: 13, borderRadius: 8, background: "#10354a", color: "#9ec3d2", fontSize: 11, lineHeight: 1.5 }}><ShieldCheck size={15} color="#8bd44f" style={{ verticalAlign: "middle", marginRight: 7 }} />Policy changes apply to new and active sessions.</div></section>
      </div>
    );
  }

  if (page === "URL Logs") {
    const logs = [
      ["10:42:19", "Guest", "Android-S25-Ultra", "www.google.com"],
      ["10:42:16", "Guest", "Android-S25-Ultra", "s.ntv.io"],
      ["10:41:54", "Guest", "MacBook-Air", "api.github.com"],
      ["10:40:31", "Guest", "Pixel-8-Pro", "www.youtube.com"],
      ["10:39:18", "Guest", "MacBook-Air", "images.unsplash.com"],
    ];
    return <section style={panel}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}><div style={{ display: "flex", alignItems: "center", gap: 9 }}><FileText size={18} color="#58bdf2" /><span style={{ fontSize: 14, fontWeight: 800 }}>Visited websites</span></div><div style={{ display: "flex", gap: 9 }}><span style={{ padding: "8px 12px", border: "1px solid #24566f", borderRadius: 7, color: "#9cbac5", fontSize: 11 }}>Today <ChevronDown size={13} style={{ verticalAlign: "middle", marginLeft: 5 }} /></span><button style={{ padding: "8px 12px", border: "1px solid #24566f", borderRadius: 7, background: "#10364c", color: "#c0e3ef", fontSize: 11, fontWeight: 800 }}>EXPORT CSV</button></div></div><div style={{ overflow: "hidden", border: "1px solid #16455d", borderRadius: 8 }}><div style={{ display: "grid", gridTemplateColumns: ".8fr .7fr 1.4fr 1.4fr", padding: "12px 14px", background: "#10364c", color: "#6cb6d8", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em" }}><div>ACCESS TIME</div><div>USER</div><div>DEVICE</div><div>URL</div></div>{logs.map((row) => <div key={`${row[0]}-${row[3]}`} style={{ display: "grid", gridTemplateColumns: ".8fr .7fr 1.4fr 1.4fr", padding: "15px 14px", borderTop: "1px solid #123e55", color: "#dcecf2", fontSize: 12 }}><div>{row[0]}</div><div style={{ color: "#91afbc" }}>{row[1]}</div><div>{row[2]}</div><div style={{ color: "#83c7eb" }}>{row[3]}</div></div>)}</div></section>;
  }

  if (page === "Authentication") {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><section style={panel}><div style={{ ...subheading, marginBottom: 4 }}>LOGIN METHODS</div><ToggleRow label="Require authentication" detail="Redirect new clients to the captive portal." /><ToggleRow label="Access password" detail="Allow a shared password on the login page." /><ToggleRow label="Voucher codes" detail="Use time-limited guest access codes." /><ToggleRow label="User accounts" detail="Give repeat guests a personal login." enabled={false} /><ToggleRow label="Accept terms of use" detail="Require legal confirmation before access." /></section><section style={panel}><div style={{ ...subheading, marginBottom: 15 }}>PORTAL DESIGN</div><div style={{ height: 112, borderRadius: 9, border: "1px solid #2b617b", background: "linear-gradient(135deg, #0e3b57, #071f30)", padding: 16, boxSizing: "border-box" }}><div style={{ color: "#5ac1f7", fontSize: 10, fontWeight: 900, letterSpacing: "0.13em" }}>ANONYMIKECONNECT</div><div style={{ marginTop: 12, fontSize: 15, fontWeight: 900 }}>Welcome to the network</div><div style={{ marginTop: 5, color: "#789aaa", fontSize: 10 }}>Voucher login • English</div></div><button style={{ marginTop: 15, height: 38, width: "100%", border: "1px solid #2b617b", borderRadius: 7, background: "#10364c", color: "#b9dcea", fontSize: 11, fontWeight: 800 }}>CUSTOMIZE LOGIN PAGE</button></section></div>;
  }

  if (page === "Port Forwarding") {
    const rules = [["Minecraft server", "TCP", "25565", "192.168.10.24", "Enabled"], ["Web dashboard", "TCP", "443", "192.168.10.25", "Enabled"]];
    return <section style={panel}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}><div style={{ display: "flex", gap: 9, alignItems: "center" }}><Cable size={18} color="#58bdf2" /><span style={{ fontSize: 14, fontWeight: 800 }}>Port forwarding rules</span></div><button style={{ padding: "9px 13px", border: 0, borderRadius: 7, background: "#1b9ce8", color: "white", fontSize: 11, fontWeight: 900 }}>ADD RULE</button></div><div style={{ border: "1px solid #16455d", borderRadius: 8, overflow: "hidden" }}><div style={{ display: "grid", gridTemplateColumns: "1.4fr .7fr .7fr 1.1fr .8fr", padding: "12px 14px", background: "#10364c", color: "#6cb6d8", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em" }}><div>NAME</div><div>PROTOCOL</div><div>PORT</div><div>DESTINATION</div><div>STATUS</div></div>{rules.map((rule) => <div key={rule[0]} style={{ display: "grid", gridTemplateColumns: "1.4fr .7fr .7fr 1.1fr .8fr", padding: "16px 14px", borderTop: "1px solid #123e55", color: "#dcecf2", fontSize: 12 }}><div>{rule[0]}</div><div>{rule[1]}</div><div>{rule[2]}</div><div>{rule[3]}</div><div style={{ color: "#9ee77b", fontWeight: 800 }}>{rule[4]}</div></div>)}</div><div style={{ marginTop: 13, color: "#789aaa", fontSize: 11 }}>Port forwarding is available in Router Mode (NAT). UPnP can create rules automatically for supported apps.</div></section>;
  }

  if (page === "File Sharing") {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr .9fr", gap: 14 }}><section style={panel}><div style={{ ...subheading, marginBottom: 14 }}>LOCAL FILE SERVER</div><div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "#10364c", borderRadius: 9 }}><Share2 size={22} color="#5bc5fb" /><div><div style={{ fontSize: 13, fontWeight: 900 }}>File sharing is enabled</div><div style={{ color: "#789aaa", fontSize: 11, marginTop: 4 }}>Guests can browse approved files on the local network.</div></div></div><div style={{ marginTop: 18 }}><Field label="Share URL" value="http://192.168.10.1:9090/share" /><button style={{ marginTop: 12, height: 38, padding: "0 14px", border: "1px solid #2b617b", borderRadius: 7, background: "#10364c", color: "#c0e3ef", fontSize: 11, fontWeight: 800 }}>OPEN SHARED FOLDER</button></div></section><section style={panel}><div style={{ ...subheading, marginBottom: 14 }}>SHARED CONTENT</div>{["Welcome.pdf", "Guest-WiFi-Guide.png", "House-Rules.docx"].map((file) => <div key={file} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #123e55", color: "#dcecf2", fontSize: 12 }}><span style={{ display: "flex", alignItems: "center", gap: 9 }}><FileText size={15} color="#82b3c5" />{file}</span><span style={{ color: "#789aaa", fontSize: 11 }}>Shared</span></div>)}</section></div>;
  }

  if (page === "DHCP & NAT") {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><section style={panel}><div style={{ ...subheading, marginBottom: 14 }}>DHCP SERVER</div><ToggleRow label="Enable DHCP server" detail="Automatically assign IP addresses to guests." /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}><Field label="Gateway" value="192.168.10.1" /><Field label="Subnet mask" value="255.255.255.0" /><Field label="Pool start" value="192.168.10.20" /><Field label="Pool end" value="192.168.10.240" /></div></section><section style={panel}><div style={{ ...subheading, marginBottom: 14 }}>NAT & DNS</div><ToggleRow label="Enable NAT routing" detail="Translate guest traffic through the upstream adapter." /><SelectField label="Primary DNS" value="Gateway captive DNS" /><div style={{ marginTop: 12 }}><SelectField label="Fallback DNS" value="1.1.1.1  •  Cloudflare" /></div></section></div>;
  }

  if (page === "Statistics") {
    return <div style={{ display: "grid", gap: 14 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>{[["DATA USED", "4.8 GB", "#59c5a5"], ["SESSION TIME", "06h 42m", "#70b8f3"], ["PEAK CLIENTS", "12", "#c39af7"], ["BLOCKED ADS", "8,421", "#f0bd6a"]].map(([label, value, color]) => <div key={label} style={{ ...panel, padding: 16 }}><div style={{ ...subheading, color }}>{label}</div><div style={{ marginTop: 10, fontSize: 23, fontWeight: 900 }}>{value}</div><div style={{ marginTop: 4, color: "#789aaa", fontSize: 11 }}>Since hotspot start</div></div>)}</div><section style={panel}><div style={{ ...subheading, marginBottom: 17 }}>BANDWIDTH USAGE / LAST 60 MINUTES</div><div style={{ height: 150, display: "flex", alignItems: "end", gap: 7, borderBottom: "1px solid #24566f", background: "repeating-linear-gradient(to bottom, transparent, transparent 37px, #123e55 38px)" }}>{[32, 45, 38, 54, 47, 72, 61, 78, 64, 82, 74, 88, 68, 94, 77, 83, 98, 79, 68, 86, 73, 91].map((height, index) => <div key={index} style={{ flex: 1, height: `${height}%`, minWidth: 7, borderRadius: "4px 4px 0 0", background: index > 15 ? "linear-gradient(180deg, #64c9fa, #1b9ce8)" : "#22658a" }} />)}</div><div style={{ display: "flex", justifyContent: "space-between", color: "#789aaa", fontSize: 10, marginTop: 8 }}><span>10:00</span><span>10:15</span><span>10:30</span><span>10:45</span><span>11:00</span></div></section></div>;
  }

  return null;
}

const pageDescriptions: Record<Page, string> = {
  "WLAN Hotspot": "Share an internet connection and control guest access from this computer.",
  "Network Modes": "Switch between router, repeater, bridge, and local-only hotspot configurations.",
  "Connected Clients": "Devices currently visible on the hotspot gateway.",
  "Bandwidth Manager": "Control download and upload speeds for the whole hotspot or individual clients.",
  "Firewall & Adblocker": "Protect guests and the upstream connection with network policies and filtering.",
  "URL Logs": "Review visited websites and export access records for the selected period.",
  "Authentication": "Choose how guests sign in and customize the captive portal experience.",
  "Voucher Manager": "Create time-limited access codes for the captive portal.",
  "Port Forwarding": "Route selected ports to local services and gaming devices.",
  "File Sharing": "Share approved files with connected devices without extra apps.",
  "DHCP & NAT": "Configure the guest address pool, routing, and DNS behavior.",
  "Statistics": "Review traffic, session, client, and filtering activity over time.",
  Settings: "Local defaults and operational notes for Windows deployment.",
};

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
      <aside style={{ ...styles.sidebar, overflowY: "auto" }}>
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
            <p style={{ margin: 0, color: "#89a7b6", fontSize: 13 }}>{pageDescriptions[page]}</p>
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

            <div style={{ display: "flex", gap: 7, marginTop: 15, overflowX: "auto", paddingBottom: 2 }}>
              {["Router Mode (NAT)", "Wi-Fi Repeater", "Bridge Mode", "No Internet"].map((mode, index) => (
                <button key={mode} style={{ flexShrink: 0, padding: "9px 13px", borderRadius: 7, border: index === 0 ? "1px solid #3db5f4" : "1px solid #204d64", background: index === 0 ? "#103f59" : "#071f30", color: index === 0 ? "#dff5fc" : "#83a4b3", fontSize: 11, fontWeight: 800 }}>{mode}</button>
              ))}
            </div>

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

        {page !== "WLAN Hotspot" && page !== "Connected Clients" && page !== "Voucher Manager" && page !== "Settings" && (
          <FeaturePage page={page} />
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