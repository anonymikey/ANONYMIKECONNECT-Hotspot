# Release portal for ANONYMIKECONNECT

A minimal static release portal that displays the latest Windows release
metadata (version, SHA256, size, notes) and a download button. It also
supports selecting a local `.exe` to compute its SHA256 and size in the
browser for verification before running.

## How releases work (automated)

1. Trigger `.github/workflows/release.yml` either by pushing a tag (`v1.0`,
   `v1.1`, …) or manually via **Actions → Release ANONYMIKECONNECT → Run
   workflow**.
2. The workflow builds `ANONYMIKECONNECT<VERSION>.exe` on `windows-latest`
   via `.github/scripts/windows-build.ps1` (PyInstaller, onefile).
3. It computes the SHA256 and file size, publishes a GitHub Release with the
   exe attached, and commits an updated `release-portal/release.json` whose
   `url` points at the permanent release download.
4. The portal page fetches `release.json` (relative path first, with a
   cache-buster) and displays the new version, checksum, size, and download
   immediately — no manual edits needed.

Until the first release is published, `release.json` contains no `url`, and
the page clearly says "No release published yet" instead of showing empty
placeholders.

## Deployment

This is a static site deployable to Vercel (or any static host):

- Root `vercel.json` rewrites `/` to `/release-portal/index.html`.
- A root `index.html` also redirects visitors to the portal on hosts
  without rewrite rules.
- All asset paths inside the portal are relative, so it works whether the
  site root is the repo root or `release-portal/` itself (e.g. when Vercel's
  *Root Directory* is set to `release-portal`).
- The preview image lives at `release-portal/assets/` so it ships with the
  portal in every layout.

## Verifying an installer manually

PowerShell:

```powershell
Get-FileHash ANONYMIKECONNECTV1.0.exe -Algorithm SHA256
```

macOS / Linux:

```sh
shasum -a 256 ANONYMIKECONNECTV1.0.exe
```

The hash must match the SHA256 shown on the portal before you run the file.

## Building locally (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .github/scripts/windows-build.ps1
```

Add `-SkipBuild` to recompute `release.json` from an existing `dist/` exe.
