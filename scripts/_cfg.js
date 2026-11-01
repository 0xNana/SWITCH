// reads the generated frontend/config.js (window.AFTERLIFE_CONFIG = {...};)
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "frontend", "config.js"), "utf8");
module.exports = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
