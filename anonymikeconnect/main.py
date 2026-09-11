"""ANONYMIKECONNECT desktop application."""

from __future__ import annotations

import io
import threading
import tkinter as tk
from datetime import datetime
from pathlib import Path
from tkinter import messagebox, ttk
from urllib.request import urlopen

import customtkinter as ctk
import qrcode
from PIL import Image

from .database import VoucherStore
from .network import Adapter, NetworkManager
from .portal import CaptivePortal


ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

BG = "#061c2c"
PANEL = "#09283b"
PANEL_2 = "#0d344a"
ACCENT = "#1999e7"
ACCENT_SOFT = "#49b4f4"
MUTED = "#8ba8b8"
SUCCESS = "#8bd348"
BRAND_LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202026%2C%2001_08_15%20PM-h1DWAiZ5E3Y4SMk3A2I7AdYEu0dclb.png"


class AnonymikeConnectApp(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        self.title("ANONYMIKECONNECT")
        self.geometry("1180x760")
        self.minsize(980, 650)
        self.configure(fg_color=BG)

        self.store = VoucherStore()
        self.network = NetworkManager()
        self.adapters: list[Adapter] = []
        self.portal: CaptivePortal | None = None
        self.active_page = "WLAN Hotspot"
        self.show_password = False

        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        self._build_sidebar()
        self._build_content()
        self._load_adapters()
        self._refresh_vouchers()
        self._refresh_clients()

    def _load_brand_image(self) -> ctk.CTkImage | None:
        try:
            with urlopen(BRAND_LOGO_URL, timeout=2) as response:
                image = Image.open(io.BytesIO(response.read())).convert("RGBA")
            return ctk.CTkImage(light_image=image, dark_image=image, size=(170, 82))
        except Exception:
            return None

    def _build_sidebar(self) -> None:
        sidebar = ctk.CTkFrame(self, width=218, corner_radius=0, fg_color="#08263a")
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_propagate(False)
        sidebar.grid_rowconfigure(7, weight=1)

        logo = self._load_brand_image()
        if logo is not None:
            ctk.CTkLabel(sidebar, text="", image=logo).grid(
                row=0, column=0, padx=24, pady=(22, 8), sticky="w"
            )
        else:
            ctk.CTkLabel(
                sidebar,
                text="ANONYMIKE\nCONNECT",
                justify="left",
                font=ctk.CTkFont(size=23, weight="bold"),
                text_color="#f4f9fb",
            ).grid(row=0, column=0, padx=24, pady=(28, 8), sticky="w")
        ctk.CTkLabel(
            sidebar,
            text="LOCAL HOTSPOT CONTROL",
            font=ctk.CTkFont(size=10, weight="bold"),
            text_color=ACCENT_SOFT,
        ).grid(row=1, column=0, padx=25, pady=(0, 26), sticky="w")

        self.nav_buttons: dict[str, ctk.CTkButton] = {}
        for row, (label, icon) in enumerate(
            [
                ("WLAN Hotspot", "◉"),
                ("Connected Clients", "▣"),
                ("Voucher Manager", "▤"),
                ("Settings", "⚙"),
            ],
            start=2,
        ):
            button = ctk.CTkButton(
                sidebar,
                text=f"  {icon}   {label}",
                anchor="w",
                height=46,
                corner_radius=8,
                fg_color="transparent",
                hover_color=PANEL_2,
                text_color="#c4d6df",
                font=ctk.CTkFont(size=13, weight="bold"),
                command=lambda page=label: self._show_page(page),
            )
            button.grid(row=row, column=0, padx=13, pady=3, sticky="ew")
            self.nav_buttons[label] = button

        ctk.CTkLabel(
            sidebar,
            text="v0.1.0  •  LOCAL ONLY",
            text_color="#577e91",
            font=ctk.CTkFont(size=10),
        ).grid(row=8, column=0, padx=25, pady=(0, 24), sticky="w")
        self._set_active_nav("WLAN Hotspot")

    def _build_content(self) -> None:
        self.content = ctk.CTkFrame(self, corner_radius=0, fg_color=BG)
        self.content.grid(row=0, column=1, sticky="nsew")
        self.content.grid_rowconfigure(0, weight=1)
        self.content.grid_columnconfigure(0, weight=1)
        self.pages: dict[str, ctk.CTkFrame] = {}
        self._build_hotspot_page()
        self._build_clients_page()
        self._build_vouchers_page()
        self._build_settings_page()
        self._show_page("WLAN Hotspot")

    def _new_page(self, name: str) -> ctk.CTkFrame:
        page = ctk.CTkFrame(self.content, fg_color=BG)
        page.grid(row=0, column=0, sticky="nsew")
        page.grid_columnconfigure(0, weight=1)
        page.grid_rowconfigure(2, weight=1)
        self.pages[name] = page
        return page

    def _page_header(self, page: ctk.CTkFrame, eyebrow: str, title: str, description: str) -> None:
        header = ctk.CTkFrame(page, fg_color="transparent")
        header.grid(row=0, column=0, padx=34, pady=(30, 18), sticky="ew")
        ctk.CTkLabel(
            header,
            text=eyebrow.upper(),
            text_color=ACCENT_SOFT,
            font=ctk.CTkFont(size=11, weight="bold"),
        ).pack(anchor="w")
        ctk.CTkLabel(
            header,
            text=title,
            text_color="#f2f7fa",
            font=ctk.CTkFont(size=28, weight="bold"),
        ).pack(anchor="w", pady=(4, 2))
        ctk.CTkLabel(header, text=description, text_color=MUTED, font=ctk.CTkFont(size=12)).pack(
            anchor="w"
        )

    def _section(self, page: ctk.CTkFrame, row: int) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(page, fg_color=PANEL, corner_radius=12)
        frame.grid(row=row, column=0, padx=34, pady=10, sticky="nsew")
        frame.grid_columnconfigure(0, weight=1)
        return frame

    def _build_hotspot_page(self) -> None:
        page = self._new_page("WLAN Hotspot")
        self._page_header(
            page,
            "Network access",
            "WLAN Hotspot",
            "Share an internet connection and control guest access from this computer.",
        )
        form = self._section(page, 1)
        form.grid_columnconfigure(1, weight=1)
        form.grid_columnconfigure(3, weight=1)

        self.internet_combo = self._field(form, "Internet connection", 0, 0)
        self.wifi_combo = self._field(form, "Wi-Fi broadcast adapter", 0, 2)
        self.ssid_entry = self._entry_field(form, "Network name (SSID)", 1, 0, "ANONYMIKECONNECT")
        self.password_entry = self._entry_field(form, "Network key", 1, 2, "12345678", secret=True)
        self.gateway_entry = self._entry_field(form, "Gateway IP", 2, 0, "192.168.10.1")
        self.portal_port_entry = self._entry_field(form, "Portal port", 2, 2, "8080")

        action = ctk.CTkFrame(page, fg_color="transparent")
        action.grid(row=2, column=0, padx=34, pady=(12, 10), sticky="ew")
        action.grid_columnconfigure(0, weight=1)
        self.hotspot_button = ctk.CTkButton(
            action,
            text="START HOTSPOT",
            height=48,
            corner_radius=8,
            fg_color=ACCENT,
            hover_color="#36a9ef",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._toggle_hotspot,
        )
        self.hotspot_button.grid(row=0, column=0, sticky="ew")
        ctk.CTkButton(
            action,
            text="QR",
            width=70,
            height=48,
            corner_radius=8,
            fg_color=PANEL_2,
            hover_color="#174861",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._show_qr,
        ).grid(row=0, column=1, padx=(10, 0))

        self.status_card = ctk.CTkFrame(page, fg_color=PANEL, corner_radius=12)
        self.status_card.grid(row=3, column=0, padx=34, pady=10, sticky="ew")
        self.status_card.grid_columnconfigure(1, weight=1)
        self.status_indicator = ctk.CTkLabel(
            self.status_card, text="●", text_color="#627989", font=ctk.CTkFont(size=22)
        )
        self.status_indicator.grid(row=0, column=0, padx=(20, 8), pady=16)
        self.status_label = ctk.CTkLabel(
            self.status_card,
            text="Hotspot is stopped",
            text_color="#d5e1e7",
            font=ctk.CTkFont(size=13, weight="bold"),
            anchor="w",
        )
        self.status_label.grid(row=0, column=1, sticky="w")
        self.status_detail = ctk.CTkLabel(
            self.status_card,
            text="Choose adapters and start a local network.",
            text_color=MUTED,
            font=ctk.CTkFont(size=12),
            anchor="w",
        )
        self.status_detail.grid(row=1, column=1, pady=(0, 16), sticky="w")

    def _field(self, parent: ctk.CTkFrame, label: str, row: int, column: int) -> ctk.CTkComboBox:
        wrapper = ctk.CTkFrame(parent, fg_color="transparent")
        wrapper.grid(row=row * 2, column=column, padx=18, pady=(20, 4), sticky="ew")
        wrapper.grid_columnconfigure(0, weight=1)
        ctk.CTkLabel(wrapper, text=label.upper(), text_color=MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(
            row=0, column=0, sticky="w"
        )
        combo = ctk.CTkComboBox(wrapper, values=["Detecting adapters…"], height=38, corner_radius=6)
        combo.grid(row=1, column=0, pady=(7, 0), sticky="ew")
        return combo

    def _entry_field(
        self,
        parent: ctk.CTkFrame,
        label: str,
        row: int,
        column: int,
        value: str,
        secret: bool = False,
    ) -> ctk.CTkEntry:
        wrapper = ctk.CTkFrame(parent, fg_color="transparent")
        wrapper.grid(row=row * 2, column=column, padx=18, pady=(20, 4), sticky="ew")
        wrapper.grid_columnconfigure(0, weight=1)
        ctk.CTkLabel(wrapper, text=label.upper(), text_color=MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(
            row=0, column=0, sticky="w"
        )
        entry = ctk.CTkEntry(wrapper, height=38, corner_radius=6, show="•" if secret else "")
        entry.insert(0, value)
        entry.grid(row=1, column=0, pady=(7, 0), sticky="ew")
        if secret:
            ctk.CTkButton(
                wrapper,
                text="SHOW",
                width=52,
                height=26,
                fg_color="transparent",
                hover_color=PANEL_2,
                text_color=ACCENT_SOFT,
                font=ctk.CTkFont(size=10, weight="bold"),
                command=lambda: self._toggle_password(entry),
            ).place(relx=1, rely=0.66, anchor="e", x=-7)
        return entry

    def _build_clients_page(self) -> None:
        page = self._new_page("Connected Clients")
        self._page_header(page, "Live network", "Connected clients", "Devices currently visible on the hotspot gateway.")
        panel = self._section(page, 1)
        panel.grid_rowconfigure(1, weight=1)
        columns = ("hostname", "ip", "mac", "time")
        self.client_tree = ttk.Treeview(panel, columns=columns, show="headings", height=15)
        headings = {"hostname": "HOSTNAME", "ip": "IP ADDRESS", "mac": "MAC ADDRESS", "time": "CONNECTION TIME"}
        widths = {"hostname": 220, "ip": 150, "mac": 220, "time": 180}
        for column in columns:
            self.client_tree.heading(column, text=headings[column])
            self.client_tree.column(column, width=widths[column], anchor="w")
        style = ttk.Style()
        style.theme_use("default")
        style.configure("Treeview", background=PANEL, fieldbackground=PANEL, foreground="#dce9ef", rowheight=36, borderwidth=0)
        style.configure("Treeview.Heading", background=PANEL_2, foreground=ACCENT_SOFT, relief="flat", font=("Segoe UI", 10, "bold"))
        style.map("Treeview", background=[("selected", "#185778")], foreground=[("selected", "white")])
        self.client_tree.grid(row=0, column=0, padx=16, pady=16, sticky="nsew")
        panel.grid_columnconfigure(0, weight=1)
        ctk.CTkButton(panel, text="REFRESH CLIENTS", width=150, height=34, command=self._refresh_clients).grid(
            row=1, column=0, padx=16, pady=(0, 16), sticky="e"
        )

    def _build_vouchers_page(self) -> None:
        page = self._new_page("Voucher Manager")
        self._page_header(page, "Guest access", "Voucher manager", "Create time-limited access codes for the captive portal.")
        controls = self._section(page, 1)
        controls.grid_columnconfigure(1, weight=1)
        ctk.CTkLabel(controls, text="QUANTITY", text_color=MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(
            row=0, column=0, padx=(18, 8), pady=18
        )
        self.voucher_quantity = ctk.CTkEntry(controls, width=90, height=36)
        self.voucher_quantity.insert(0, "5")
        self.voucher_quantity.grid(row=0, column=1, pady=18, sticky="w")
        ctk.CTkLabel(controls, text="DURATION", text_color=MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(
            row=0, column=2, padx=(18, 8), pady=18
        )
        self.voucher_duration = ctk.CTkComboBox(controls, width=150, height=36, values=["30 minutes", "1 hour", "4 hours", "24 hours"])
        self.voucher_duration.set("1 hour")
        self.voucher_duration.grid(row=0, column=3, padx=(0, 18), pady=18)
        ctk.CTkButton(controls, text="GENERATE VOUCHERS", height=36, command=self._generate_vouchers).grid(
            row=0, column=4, padx=(0, 18), pady=18
        )

        table_panel = self._section(page, 2)
        table_panel.grid_rowconfigure(0, weight=1)
        table_panel.grid_columnconfigure(0, weight=1)
        self.voucher_tree = ttk.Treeview(
            table_panel, columns=("code", "created", "expires", "status"), show="headings", height=15
        )
        for column, heading, width in [
            ("code", "VOUCHER CODE", 220),
            ("created", "CREATED", 180),
            ("expires", "EXPIRES", 180),
            ("status", "STATUS", 120),
        ]:
            self.voucher_tree.heading(column, text=heading)
            self.voucher_tree.column(column, width=width, anchor="w")
        self.voucher_tree.grid(row=0, column=0, padx=16, pady=16, sticky="nsew")

    def _build_settings_page(self) -> None:
        page = self._new_page("Settings")
        self._page_header(page, "Application", "Settings", "Local defaults and operational notes for Windows deployment.")
        panel = self._section(page, 1)
        rows = [
            ("Database", str(Path("data/anonymikeconnect.sqlite3")), "Voucher data is kept locally in SQLite."),
            ("Portal", "Flask + local DNS redirector", "The DNS listener needs administrator privileges on port 53."),
            ("Hotspot engine", "Hosted Network + Mobile Hotspot fallback", "Falls back to Windows Mobile Hotspot when the driver lacks Hosted Network."),
        ]
        for row, (label, value, note) in enumerate(rows):
            ctk.CTkLabel(panel, text=label.upper(), text_color=MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(
                row=row, column=0, padx=20, pady=(20 if row == 0 else 12, 3), sticky="w"
            )
            ctk.CTkLabel(panel, text=value, text_color="#e3edf2", font=ctk.CTkFont(size=14, weight="bold")).grid(
                row=row, column=1, padx=20, pady=(20 if row == 0 else 12, 3), sticky="w"
            )
            ctk.CTkLabel(panel, text=note, text_color=MUTED, font=ctk.CTkFont(size=12)).grid(
                row=row, column=2, padx=20, pady=(20 if row == 0 else 12, 3), sticky="w"
            )
        panel.grid_columnconfigure(2, weight=1)

    def _set_active_nav(self, page: str) -> None:
        for name, button in self.nav_buttons.items():
            button.configure(fg_color=PANEL_2 if name == page else "transparent")

    def _show_page(self, page: str) -> None:
        self.active_page = page
        self.pages[page].tkraise()
        self._set_active_nav(page)

    def _toggle_password(self, entry: ctk.CTkEntry) -> None:
        self.show_password = not self.show_password
        entry.configure(show="" if self.show_password else "•")

    def _load_adapters(self) -> None:
        self.adapters = self.network.list_adapters()
        labels = [adapter.label for adapter in self.adapters] or ["No adapters detected"]
        self.internet_combo.configure(values=labels)
        self.wifi_combo.configure(values=labels)
        if self.adapters:
            self.internet_combo.set(self.adapters[0].label)
            self.wifi_combo.set(self.adapters[-1].label)
        else:
            self.internet_combo.set(labels[0])
            self.wifi_combo.set(labels[0])

    def _selected_adapter_name(self, combo: ctk.CTkComboBox) -> str:
        selected = combo.get()
        for adapter in self.adapters:
            if adapter.label == selected:
                return adapter.name
        return selected

    def _toggle_hotspot(self) -> None:
        if self.network.active:
            result = self.network.stop_hotspot(
                self._selected_adapter_name(self.internet_combo),
                self._selected_adapter_name(self.wifi_combo),
            )
            if self.portal:
                self.portal.stop()
                self.portal = None
            self._set_hotspot_status(False, result.error or "Hotspot stopped.")
            return

        gateway = self.gateway_entry.get().strip() or "192.168.10.1"
        try:
            port = int(self.portal_port_entry.get().strip() or "8080")
        except ValueError:
            messagebox.showerror("Invalid portal port", "Portal port must be a number.")
            return
        self.network.gateway_ip = gateway
        result = self.network.start_hotspot(
            self._selected_adapter_name(self.internet_combo),
            self._selected_adapter_name(self.wifi_combo),
            self.ssid_entry.get(),
            self.password_entry.get(),
        )
        if not result.ok:
            messagebox.showerror("Could not start hotspot", result.error or result.output)
            self._set_hotspot_status(False, result.error or "Hotspot did not start.")
            return

        # start_hotspot may switch to Windows Mobile Hotspot, which forces its
        # own gateway/subnet — always use whatever gateway the network manager
        # settled on so the portal binds to a real local address.
        effective_gateway = self.network.gateway_ip
        self.portal = CaptivePortal(self.store, self.network, self.ssid_entry.get(), effective_gateway, port)
        status = self.portal.start(enable_dns=True)
        detail = result.error or status.message
        self._set_hotspot_status(True, detail)

    def _set_hotspot_status(self, active: bool, detail: str) -> None:
        self.hotspot_button.configure(text="STOP HOTSPOT" if active else "START HOTSPOT")
        self.status_indicator.configure(text_color=SUCCESS if active else "#627989")
        self.status_label.configure(text="Hotspot is running" if active else "Hotspot is stopped")
        self.status_detail.configure(text=detail)

    def _refresh_clients(self) -> None:
        if not hasattr(self, "client_tree"):
            return
        for item in self.client_tree.get_children():
            self.client_tree.delete(item)
        for client in self.network.connected_clients():
            self.client_tree.insert(
                "",
                "end",
                values=(client["hostname"], client["ip"], client["mac"], client["connection_time"]),
            )
        self.after(8000, self._refresh_clients)

    def _refresh_vouchers(self) -> None:
        if not hasattr(self, "voucher_tree"):
            return
        for item in self.voucher_tree.get_children():
            self.voucher_tree.delete(item)
        for voucher in self.store.list_vouchers():
            self.voucher_tree.insert(
                "",
                "end",
                values=(voucher.code, voucher.created_at[:16].replace("T", " "), voucher.expires_at[:16].replace("T", " "), voucher.status.upper()),
            )

    def _generate_vouchers(self) -> None:
        try:
            quantity = int(self.voucher_quantity.get())
        except ValueError:
            messagebox.showerror("Invalid quantity", "Quantity must be a whole number.")
            return
        duration_map = {"30 minutes": 30, "1 hour": 60, "4 hours": 240, "24 hours": 1440}
        created = self.store.create_vouchers(quantity, duration_map.get(self.voucher_duration.get(), 60))
        self._refresh_vouchers()
        messagebox.showinfo("Vouchers generated", f"Created {len(created)} new access vouchers.")

    def _show_qr(self) -> None:
        if not self.network.active:
            messagebox.showinfo("Hotspot is stopped", "Start the hotspot before generating a connection QR code.")
            return
        payload = f"WIFI:T:WPA;S:{self.ssid_entry.get()};P:{self.password_entry.get()};;"
        image = qrcode.make(payload).convert("RGB")
        dialog = ctk.CTkToplevel(self)
        dialog.title("Connect to ANONYMIKECONNECT")
        dialog.geometry("360x430")
        dialog.configure(fg_color=BG)
        dialog.transient(self)
        ctk_image = ctk.CTkImage(light_image=image, dark_image=image, size=(280, 280))
        label = ctk.CTkLabel(dialog, image=ctk_image, text="")
        label.pack(pady=(28, 12))
        ctk.CTkLabel(dialog, text=self.ssid_entry.get(), text_color="#f2f7fa", font=ctk.CTkFont(size=16, weight="bold")).pack()
        ctk.CTkLabel(dialog, text="Scan with a mobile device to join the hotspot.", text_color=MUTED).pack(pady=8)

    def destroy(self) -> None:
        if self.portal:
            self.portal.stop()
        if self.network.active:
            self.network.stop_hotspot()
        super().destroy()


def main() -> None:
    app = AnonymikeConnectApp()
    app.mainloop()


if __name__ == "__main__":
    main()
