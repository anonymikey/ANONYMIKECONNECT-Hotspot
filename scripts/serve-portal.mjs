#!/usr/bin/env node
/**
 * Minimal static file server for the ANONYMIKECONNECT release portal.
 * Serves the repository root so /release-portal/ and the root redirect
 * both work. Binds 0.0.0.0 and honors the injected PORT.
 */
import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 8080;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);

    // Directory-style URLs resolve to index.html
    if (pathname.endsWith("/")) pathname += "index.html";
    // Redirect /release-portal -> /release-portal/ so relative asset paths work
    if (!path.extname(pathname)) {
      const dirIndex = path.join(root, pathname, "index.html");
      if (path.join(root, pathname) !== root && (await fs.stat(dirIndex).then(() => true, () => false))) {
        res.writeHead(302, { Location: pathname + "/" }).end();
        return;
      }
    }

    // Never serve dotfiles (e.g. .git)
    if (pathname.split("/").some((seg) => seg.startsWith("."))) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const filePath = path.normalize(path.join(root, pathname));
    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const body = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(body);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    } else {
      res.writeHead(500, { "Content-Type": "text/plain" }).end("Server error");
    }
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Release portal serving ${root} on http://0.0.0.0:${port}`);
});
