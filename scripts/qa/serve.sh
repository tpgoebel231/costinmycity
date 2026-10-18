#!/bin/sh
# Serve the static export in out/ on port 4173.
# HTTP/1.1, gzip, and a long cache so a local Lighthouse run is not
# punished for a server that production (Pages/CDN) would not use.
cd "$(dirname "$0")/../.." || exit 1
if [ ! -d out ]; then
  echo "serve.sh: missing out/. Run npm run build first." >&2
  exit 1
fi
PORT="${PORT:-4173}"
exec python3 - "$PORT" <<'PY'
import gzip
import http.server
import mimetypes
import os
import sys

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

COMPRESS = (".html", ".js", ".css", ".svg", ".json", ".xml", ".txt", ".map")

class Handler(http.server.SimpleHTTPRequestHandler):
    # Absolute root. Do not chdir into out/: `next build` deletes and
    # recreates that directory, and a handler that calls os.getcwd() then
    # crashes with FileNotFoundError (Chrome shows an interstitial).
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path.split("?", 1)[0])
        if os.path.isdir(path):
            index = os.path.join(path, "index.html")
            if os.path.isfile(index):
                path = index
            else:
                return super().do_GET()
        if not os.path.isfile(path):
            return super().do_GET()
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as handle:
            data = handle.read()
        encoding = None
        if path.endswith(COMPRESS) and "gzip" in self.headers.get("Accept-Encoding", "") and len(data) > 256:
            data = gzip.compress(data, compresslevel=6)
            encoding = "gzip"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        if encoding:
            self.send_header("Content-Encoding", encoding)
            self.send_header("Vary", "Accept-Encoding")
        url = self.path.split("?", 1)[0]
        if url.startswith("/_next/static/") or url.startswith("/img/") or url.endswith((".woff2", ".png", ".webp", ".avif", ".ico", ".js")):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        return

port = int(sys.argv[1])
ROOT = os.path.abspath("out")
server = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
print("serving %s on http://127.0.0.1:%s/ (gzip, http/1.1)" % (ROOT, port), flush=True)
server.serve_forever()
PY
