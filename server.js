const crypto = require("crypto");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");

const root = __dirname;
const dataFile = path.join(root, "data", "site.json");
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";
const adminPassword = process.env.ADMIN_PASSWORD;
const sessions = new Map();

if (!adminPassword) {
  console.error("ADMIN_PASSWORD is required before starting the admin server.");
  process.exit(1);
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
};

const send = (res, status, body, type = "application/json; charset=utf-8") => {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
};

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 128 * 1024) {
      req.destroy();
      reject(new Error("request too large"));
    }
  });
  req.on("end", () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch (error) {
      reject(error);
    }
  });
});

const getToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
};

const isAuthed = (req) => sessions.has(getToken(req));

const sanitizeSite = (site) => ({
  siteName: String(site.siteName || "suancai_soup").slice(0, 80),
  tagline: String(site.tagline || "").slice(0, 120),
  heroEyebrow: String(site.heroEyebrow || "").slice(0, 80),
  heroTitle: String(site.heroTitle || "").slice(0, 160),
  heroText: String(site.heroText || "").slice(0, 600),
  profileName: String(site.profileName || "").slice(0, 80),
  profileBio: String(site.profileBio || "").slice(0, 600),
  contactText: String(site.contactText || "").slice(0, 200),
  aboutIntro: String(site.aboutIntro || "").slice(0, 600),
  aboutCards: Array.isArray(site.aboutCards) ? site.aboutCards.slice(0, 6).map((card) => ({
    title: String(card.title || "").slice(0, 80),
    body: String(card.body || "").slice(0, 500),
  })) : [],
  timeline: Array.isArray(site.timeline) ? site.timeline.slice(0, 8).map((entry) => ({
    number: String(entry.number || "").slice(0, 8),
    title: String(entry.title || "").slice(0, 80),
    body: String(entry.body || "").slice(0, 500),
  })) : [],
  links: Array.isArray(site.links) ? site.links.slice(0, 12).map((link) => ({
    label: String(link.label || "").slice(0, 60),
    href: String(link.href || "#").slice(0, 300),
  })) : [],
  categories: Array.isArray(site.categories) ? site.categories.slice(0, 20).map((item) => String(item).slice(0, 40)) : [],
});

const handleApi = async (req, res) => {
  if (req.url === "/api/login" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (body.password !== adminPassword) {
      send(res, 401, JSON.stringify({ error: "invalid password" }));
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now());
    send(res, 200, JSON.stringify({ token }));
    return;
  }

  if (req.url === "/api/site" && req.method === "GET") {
    if (!isAuthed(req)) {
      send(res, 401, JSON.stringify({ error: "unauthorized" }));
      return;
    }
    send(res, 200, await fs.readFile(dataFile, "utf8"));
    return;
  }

  if (req.url === "/api/site" && req.method === "PUT") {
    if (!isAuthed(req)) {
      send(res, 401, JSON.stringify({ error: "unauthorized" }));
      return;
    }
    const site = sanitizeSite(await readJsonBody(req));
    try {
      const current = await fs.readFile(dataFile, "utf8");
      await fs.writeFile(`${dataFile}.bak`, current, "utf8");
    } catch {
      // The first save may happen before a backup exists.
    }
    await fs.writeFile(dataFile, `${JSON.stringify(site, null, 2)}\n`, "utf8");
    send(res, 200, JSON.stringify({ ok: true }));
    return;
  }

  send(res, 404, JSON.stringify({ error: "not found" }));
};

const serveStatic = async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const target = path.resolve(root, rel);

  if (!target.startsWith(root)) {
    send(res, 403, "forbidden", "text/plain; charset=utf-8");
    return;
  }

  try {
    const data = await fs.readFile(target);
    const type = types[path.extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    send(res, 404, "not found", "text/plain; charset=utf-8");
  }
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
    } else {
      await serveStatic(req, res);
    }
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }));
  }
});

server.listen(port, host, () => {
  console.log(`suancai_soup blog server listening on http://${host}:${port}`);
});
