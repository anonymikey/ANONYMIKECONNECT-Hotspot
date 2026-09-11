Release portal for Vercel

This folder contains a minimal static release portal that displays the latest Windows release metadata for ANONYMIKECONNECT and provides a download button.

Deployment
- This is a static site and can be deployed directly to Vercel by connecting the repository and creating a new Project.
- The root path is rewritten to /release-portal/index.html by vercel.json so visiting the project's domain shows the portal.

How release.json is managed
- release-portal/release.json is a placeholder. Your CI (GitHub Actions) should overwrite this file or update the GitHub Release and publish the installer to a CDN/Release URL.
- Recommended flow: CI builds ANONYMIKECONNECTV1.0.exe on windows-latest, computes SHA256 and size, uploads the EXE to GitHub Releases, and then writes the public URL into release-portal/release.json (commit + push or upload to a known CDN URL).

Domain setup
- After deploying on Vercel, add your custom domain (supalan.anonymiketech.space). Vercel will give DNS instructions (CNAME/A records). After DNS propagates, enable HTTPS via Vercel.

Next steps for full automation
1. Add a GitHub Actions workflow that runs on tag push or manual dispatch and does the Windows build (powershell script already added), uploads to GitHub Releases, and updates release-portal/release.json with the public download URL and checksum.
2. (Optional) Implement content-signing and more robust smoke tests in the workflow.
