/* Headless-Chrome smoke test of the real UI against the local node.
 * Injects an EIP-1193 provider that forwards to the hardhat node (its dev accounts are unlocked), so NO keys are used. */
const puppeteer = require("puppeteer-core");
const { ethers } = require("ethers");
const cfg = require("./_cfg");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const rpc = new ethers.JsonRpcProvider(cfg.rpc);
  const accts = await rpc.send("eth_accounts", []);
  const [me, b1, b2] = accts;
  const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage(); await page.setViewport({ width: 1100, height: 1500 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.exposeFunction("__rpc", (method, params) => rpc.send(method, params));
  await page.evaluateOnNewDocument((me, chainIdHex) => {
    window.ethereum = { isMock: true, on() {}, request: async ({ method, params }) => {
      if (method === "eth_requestAccounts" || method === "eth_accounts") return [me];
      if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
      if (method === "eth_chainId") return chainIdHex;
      if (method === "eth_sendTransaction") params = [{ ...params[0], from: me }];
      return window.__rpc(method, params || []);
    } };
  }, me, "0x" + cfg.chainId.toString(16));
  await page.goto("http://localhost:8080/"); await sleep(500);
  await page.click("#connect"); await sleep(1500);
  const rows = await page.$$("#bens .ben");
  await (await rows[0].$(".ba")).type(b1); await (await rows[0].$(".bp")).type("60");
  await (await rows[1].$(".ba")).type(b2); await (await rows[1].$(".bp")).type("40");
  await page.type("#vname", "UI smoke vault");
  await page.select("#wunit", "minutes"); await page.$eval("#wamt", (e) => (e.value = "1")); await page.$eval("#wamt", (e) => e.dispatchEvent(new Event("input")));
  await page.$eval("#vamt", (e) => (e.value = "2"));
  // local config uses minWindow 5s so a 1-minute window is allowed
  await page.click("#mkvault"); await sleep(4000);
  const owned = await page.$eval("#owned", (e) => e.innerText);
  console.log("OWNED PANEL:\n" + owned);
  if (!/UI smoke vault/.test(owned) || !/2 USDC/.test(owned)) throw new Error("vault not shown");
  await page.click("button[data-a=checkin]"); await sleep(2500);
  const log = await page.$eval("#log", (e) => e.innerText); console.log("TX LOG:\n" + log);
  if (!/Check in/.test(log)) throw new Error("check-in not logged");
  await page.screenshot({ path: "/workspace/afterlife/ui-smoke.png" });
  await browser.close();
  if (errs.length) throw new Error("page errors: " + errs.join("; "));
  console.log("UI TEST PASSED");
})().catch((e) => { console.error("UI TEST FAILED", e); process.exit(1); });
