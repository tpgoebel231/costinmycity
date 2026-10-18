/**
 * Screenshots and horizontal-overflow checks via Chrome DevTools Protocol.
 * No puppeteer. Node 20 has no global WebSocket, so this speaks the
 * handshake itself.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const outDir = process.env.SHOT_DIR || "/workspace/turbo/after-preview";
const port = Number(process.env.CDP_PORT || 9333);
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  ["home", "/"],
  ["charlotte-roof", "/cost/roof-replacement/charlotte-nc/"],
  ["chicago-roof", "/cost/roof-replacement/chicago-il/"],
  ["st-louis-roof", "/cost/roof-replacement/st-louis-mo/"],
  ["indianapolis-hvac", "/cost/hvac-replacement/indianapolis-in/"],
  ["accessibility", "/accessibility/"],
];

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
  });
}

class Socket {
  constructor(url) {
    this.url = new URL(url);
    this.buf = Buffer.alloc(0);
    this.open = false;
    this.queue = [];
    this.waiters = [];
    this.frags = [];
    this.fragOp = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.sock = net.connect(Number(this.url.port), this.url.hostname);
      this.sock.on("error", reject);
      this.sock.on("connect", () => {
        const key = crypto.randomBytes(16).toString("base64");
        this.sock.write(
          "GET " + this.url.pathname + this.url.search + " HTTP/1.1\r\n" +
            "Host: " + this.url.host + "\r\n" +
            "Upgrade: websocket\r\n" +
            "Connection: Upgrade\r\n" +
            "Sec-WebSocket-Key: " + key + "\r\n" +
            "Sec-WebSocket-Version: 13\r\n\r\n",
        );
      });
      this.sock.on("data", (chunk) => {
        this.buf = Buffer.concat([this.buf, chunk]);
        if (!this.open) {
          const end = this.buf.indexOf("\r\n\r\n");
          if (end < 0) return;
          const head = this.buf.slice(0, end).toString("utf8");
          this.buf = this.buf.slice(end + 4);
          if (!head.includes(" 101 ")) {
            reject(new Error(head.split("\r\n")[0]));
            return;
          }
          this.open = true;
          resolve();
        }
        this.drain();
      });
    });
  }

  drain() {
    while (this.buf.length >= 2) {
      const b0 = this.buf[0];
      const b1 = this.buf[1];
      let len = b1 & 127;
      let off = 2;
      if (len === 126) {
        if (this.buf.length < 4) return;
        len = this.buf.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (this.buf.length < 10) return;
        len = Number(this.buf.readBigUInt64BE(2));
        off = 10;
      }
      const masked = (b1 & 128) !== 0;
      const maskLen = masked ? 4 : 0;
      if (this.buf.length < off + maskLen + len) return;
      let mask = null;
      if (masked) {
        mask = this.buf.slice(off, off + 4);
        off += 4;
      }
      const raw = this.buf.slice(off, off + len);
      this.buf = this.buf.slice(off + len);
      const payload = Buffer.alloc(raw.length);
      for (let i = 0; i < raw.length; i++) payload[i] = mask ? raw[i] ^ mask[i % 4] : raw[i];
      const opcode = b0 & 15;
      const fin = (b0 & 128) !== 0;
      if (opcode === 8) {
        this.sock.end();
        return;
      }
      if (opcode === 9) {
        this.frame(payload, 0x8a);
        continue;
      }
      if (opcode === 0) {
        this.frags.push(payload);
        if (fin) this.emit(Buffer.concat(this.frags), this.fragOp);
        continue;
      }
      if (!fin) {
        this.frags = [payload];
        this.fragOp = opcode;
        continue;
      }
      this.emit(payload, opcode);
    }
  }

  emit(payload, opcode) {
    this.frags = [];
    if (opcode !== 1) return;
    const text = payload.toString("utf8");
    if (this.waiters.length) this.waiters.shift()(text);
    else this.queue.push(text);
  }

  next(ms) {
    const timeout = ms || 20000;
    const message = this.queue.length
      ? Promise.resolve(this.queue.shift())
      : new Promise((resolve) => this.waiters.push(resolve));
    return Promise.race([
      message,
      new Promise((_, reject) => setTimeout(() => reject(new Error("websocket timeout")), timeout)),
    ]);
  }

  frame(data, opcode) {
    const msg = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
    const mask = crypto.randomBytes(4);
    let header;
    if (msg.length < 126) header = Buffer.from([opcode, 0x80 | msg.length]);
    else if (msg.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(msg.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(msg.length), 2);
    }
    const masked = Buffer.alloc(msg.length);
    for (let i = 0; i < msg.length; i++) masked[i] = msg[i] ^ mask[i % 4];
    this.sock.write(Buffer.concat([header, mask, masked]));
  }

  send(text) {
    this.frame(text, 0x81);
  }

  close() {
    try {
      this.sock.end();
    } catch {
      /* already closed */
    }
  }
}

const OVERFLOW_JS = `(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const bad = [];
  for (const el of document.body.querySelectorAll("*")) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 && rect.height < 1) continue;
    if (rect.right > vw + 1 || rect.left < -1) {
      const cls = String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className || "").slice(0, 48);
      bad.push(el.tagName + (cls ? "." + cls : "") + " " + Math.round(rect.left) + ".." + Math.round(rect.right));
      if (bad.length >= 6) break;
    }
  }
  return { sw, vw, bad };
})()`;

const FOLD_JS = `(() => {
  function box(sel) {
    const el = document.querySelector(sel);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
  }
  return {
    num: box(".hero-num"),
    range: box(".range-track"),
    badge: box(".fee-badge"),
    height: window.innerHeight,
  };
})()`;

async function main() {
  const userDir = "/tmp/chrome-qa-" + process.pid;
  fs.mkdirSync(userDir, { recursive: true });
  const chrome = spawn("/usr/bin/google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + userDir,
    "about:blank",
  ], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 40; i++) {
    try {
      list = await getJson("http://127.0.0.1:" + port + "/json/list");
      if (list.length) break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!list || !list.length) throw new Error("Chrome DevTools did not open");
  const page = list.find((item) => item.type === "page") || list[0];
  const ws = new Socket(page.webSocketDebuggerUrl);
  await ws.connect();
  let seq = 0;
  const pending = new Map();
  const events = new Map();
  const reader = (async () => {
    while (true) {
      const text = await ws.next(60000);
      const msg = JSON.parse(text);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else if (msg.method) {
        const bucket = events.get(msg.method) || [];
        bucket.push(msg);
        events.set(msg.method, bucket);
      }
    }
  })();
  reader.catch(() => {});

  function call(method, params, timeout) {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params: params || {} }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout " + method)), timeout || 20000);
      pending.set(id, (msg) => {
        clearTimeout(timer);
        if (msg.error) reject(new Error(method + " " + JSON.stringify(msg.error)));
        else resolve(msg.result || {});
      });
    });
  }

  async function waitLoad() {
    const start = Date.now();
    while (Date.now() - start < 20000) {
      const bucket = events.get("Page.loadEventFired");
      if (bucket && bucket.length) {
        events.set("Page.loadEventFired", []);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error("load timeout");
  }

  await call("Page.enable");
  await call("Runtime.enable");
  const failures = [];

  for (const [name, urlPath] of pages) {
    for (const [width, height] of [[1440, 900], [390, 844], [375, 812], [320, 720]]) {
      events.set("Page.loadEventFired", []);
      await call("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 500,
      });
      await call("Page.navigate", { url: base + urlPath });
      await waitLoad();
      await call("Runtime.evaluate", {
        expression: "document.fonts.ready.then(() => document.readyState)",
        awaitPromise: true,
        returnByValue: true,
      });
      const measured = await call("Runtime.evaluate", {
        expression: OVERFLOW_JS,
        returnByValue: true,
      });
      const box = measured.result && measured.result.value;
      if (!box || box.sw > box.vw + 1) {
        failures.push(name + " " + width + " scrollWidth=" + (box && box.sw) + " viewport=" + (box && box.vw) + " " + JSON.stringify(box && box.bad));
      } else if (width === 375 || width === 390 || width === 320) {
        console.log(name + " " + width + " scrollWidth=" + box.sw + " viewport=" + box.vw);
      }
      if (width === 1440 || width === 390) {
        const shot = await call("Page.captureScreenshot", { format: "png" }, 30000);
        const file = path.join(outDir, name + "-" + width + ".png");
        fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
        console.log("wrote " + file);
      }
      if (width === 390 && name !== "home" && name !== "accessibility") {
        const fold = await call("Runtime.evaluate", { expression: FOLD_JS, returnByValue: true });
        const value = fold.result && fold.result.value;
        const ok = value && value.num && value.range && value.badge &&
          value.num.bottom <= height && value.range.bottom <= height && value.badge.bottom <= height &&
          value.num.top >= 0;
        console.log(name + " above-fold " + JSON.stringify(value) + (ok ? " ok" : " FAIL"));
        if (!ok) failures.push(name + " above-fold " + JSON.stringify(value));
      }
    }
  }

  ws.close();
  chrome.kill("SIGTERM");
  if (failures.length) {
    console.error("overflow: " + failures.length + " failure(s)");
    for (const line of failures) console.error("  " + line);
    process.exit(1);
  }
  console.log("overflow: no horizontal scroll at 320, 375, or 390");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
