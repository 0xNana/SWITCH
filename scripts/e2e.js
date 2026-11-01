/* End-to-end check against a live local node, driving the SAME core.js the UI uses:
 * create -> check-in -> too-early release fails -> go silent -> release -> third-party claimAll. */
const { ethers } = require("hardhat");
const C = require("../frontend/core.js");
const cfg = require("./_cfg");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [owner, ben1, ben2, relayer] = await ethers.getSigners();
  const af = new ethers.Contract(cfg.afterlife, C.AFTERLIFE_ABI, owner);
  const usdc = new ethers.Contract(cfg.usdc, C.ERC20_ABI, owner);
  const ov = await C.feeOverrides(ethers.provider, 20);
  const log = (...a) => console.log("•", ...a);

  const { addresses, shares } = C.buildBeneficiaries(
    [{ address: ben1.address, percent: "70" }, { address: ben2.address, percent: "30" }], ethers.isAddress, owner.address);
  const amount = C.parseUsdc("1");
  await (await usdc.approve(cfg.afterlife, amount, ov)).wait();
  const rcpt = await (await af.createVault("E2E vault", addresses, shares, C.windowSeconds(6, "seconds"), amount, ov)).wait();
  log("created vault, gas used", rcpt.gasUsed.toString());
  let v = await C.loadVault(af, 1, Math.floor(Date.now() / 1000));
  log("status", v.status, "balance", C.fmtUsdc(v.balance), "window", C.humanDuration(v.window));
  if (v.status !== "Active" || C.fmtUsdc(v.balance) !== "1") throw new Error("bad state after create");

  try { await (await af.connect(relayer).release(1, ov)).wait(); throw new Error("release should have failed"); }
  catch (e) { if (!/StillAlive/.test(e.message + (e.revert?.name || ""))) throw e; log("early release correctly rejected (StillAlive)"); }

  await (await af.checkIn(1, ov)).wait(); log("checked in");
  log("waiting for the window to lapse…"); await sleep(8000);
  await ethers.provider.send("evm_mine", []);
  v = await C.loadVault(af, 1, (await ethers.provider.getBlock("latest")).timestamp);
  if (!v.expired) throw new Error("vault should be expired");
  await (await af.connect(relayer).release(1, ov)).wait(); log("released by a random third party");
  const b1 = await usdc.balanceOf(ben1.address), b2 = await usdc.balanceOf(ben2.address);
  await (await af.connect(relayer).claimAll(1, ov)).wait(); log("claimAll by third party");
  const d1 = (await usdc.balanceOf(ben1.address)) - b1, d2 = (await usdc.balanceOf(ben2.address)) - b2;
  log("beneficiary 1 got", C.fmtUsdc(d1), "USDC; beneficiary 2 got", C.fmtUsdc(d2), "USDC");
  if (C.fmtUsdc(d1) !== "0.7" || C.fmtUsdc(d2) !== "0.3") throw new Error("wrong payout");
  const mine = await C.loadMine(af, owner.address, 0);
  log("owner vaults:", mine.owned.length, "| ben1 inherited:", (await C.loadMine(af, ben1.address, 0)).inherited.length);
  console.log("E2E PASSED");
}
main().catch((e) => { console.error("E2E FAILED", e); process.exit(1); });
