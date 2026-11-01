// tiny static server for ./frontend  (npm run serve)  -> http://localhost:8080
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "frontend"); const port = process.env.PORT || 8080;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
http.createServer((req, res) => {
  let p = path.normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  if (p === "/" || p === "\\") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log("Afterlife UI on http://localhost:" + port));
