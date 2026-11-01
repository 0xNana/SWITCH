# SWITCH project guide

SWITCH is a POT dead-man's switch on Portaldot V3 Testnet. The active UI is a Next.js app; the vault is a Solidity contract and the optional email service is a Bun server.

## Active network configuration

- EVM chain ID: `420420777`
- RPC: `https://test-evm-rpc-v3.portaldot.dev`
- Native asset: POT
- Explorer: `https://scanner-testnet-v3.portaldot.dev`
- Deployed testnet contract: `0x4c9c0836Be052cE08436E912fcEaB218Ce51e29f`. The address is public. Configure `NEXT_PUBLIC_SWITCH_ADDRESS` and backend `SWITCH_ADDRESS` with this address; keep the app read-only if the active deployment does not match.

## Important behavior

- The owner must check in within the configured inactivity window. Deposits, withdrawals, beneficiary edits, and closing are only available while that window is open.
- A seven-day grace period follows the missed check-in window. The owner can still check in during grace.
- Release is permissionless after the grace period but is not automatic; a transaction must call `release`.
- Beneficiaries can claim individually. `claimAll` attempts each outstanding native POT payout and lets the others proceed if one recipient rejects a transfer.
- This is unaudited testnet software. Do not describe it as a legal will or claim that email delivery or release is guaranteed.

## Key files

- `contracts/SwitchVault.sol` — active native-POT vault implementation.
- `contracts/script/DeploySwitchVault.s.sol` — testnet-only Foundry deployment script; checks chain ID before broadcasting.
- `src/lib/contract.ts` — frontend chain, ABI, address, and amount helpers.
- `src/hooks/useVault.ts` — wagmi reads for the active contract.
- `server/contract-config.ts` — backend chain and contract configuration.
- `server/index.ts` and `server/indexer.ts` — signed email registration API and Portaldot event/deadline watcher.
- `.env.example` — documented environment variables; never put real secrets in this file.

## Legacy upstream files

`contracts/Afterlife.sol`, `contracts/MockUSDC.sol`, `contracts/test/Afterlife.t.sol`, `contracts/contract-metadata/Afterlife.json`, and the Arc-specific deployment/indexing scripts are inherited from the source repository. Keep them out of the active SWITCH path. The `src/onchain-*` files are generated Arc Studio artifacts and are not used by the active app; do not use their chain facts for Portaldot.

## Local development

- `bun run dev` starts the web app on port 5173.
- `bun run server` starts the email and notification backend on port 3001.
- `bun run typecheck`, `bun run build`, and `bun run contracts:build` are the supported compile checks.
- `bun run contracts:deploy:testnet` broadcasts a deployment and requires a configured private key. Never run it unless deployment was requested.
