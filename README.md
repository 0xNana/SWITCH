# SWITCH

SWITCH is a self-custody dead-man's switch for POT on Portaldot. A vault owner names beneficiaries, deposits POT, and checks in on a schedule. If a check-in is missed, a seven-day grace period gives the owner time to return. After that, anyone can trigger release; beneficiaries can claim individually, or anyone can submit claims for them.

**Current network:** Portaldot V3 Testnet. `SwitchVault` is deployed at `0x4c9c0836Be052cE08436E912fcEaB218Ce51e29f`. The app keeps vault reads and writes disabled until configured with this address.

## Network

| Setting | Value |
| --- | --- |
| Network | Portaldot V3 Testnet |
| EVM chain ID | `420420777` |
| RPC | `https://test-evm-rpc-v3.portaldot.dev` |
| Native asset | POT |
| Explorer | `https://scanner-testnet-v3.portaldot.dev` |

## What users can do

- Create an on-chain vault with up to ten beneficiaries and percentage shares.
- Deposit POT when creating a vault or add more while its check-in window is open.
- Check in, withdraw, update beneficiaries, or close a vault while its check-in window is open.
- Trigger a release after the inactivity window and seven-day grace period have passed.
- Claim a beneficiary share individually or attempt all remaining payouts in one transaction.
- Register email reminders. Emails are optional notifications; the contract does not depend on them.

During the seven-day grace period, the owner can check in; deposits, withdrawals, beneficiary changes, and closing are paused until the vault is back within its check-in window. Release is not automatic: someone must submit the release transaction. Once released, the beneficiary list and shares are fixed. Use test tokens only; the current contract and app are unaudited.

## Run locally

Requirements: Bun, Foundry, and Node.js 20 or newer.

```sh
cp .env.example .env
bun install
bun run contracts:build
```

Start the notification backend and the web app in separate terminals:

```sh
bun run server
```

```sh
bun run dev
```

The web app is available at `http://localhost:5173`. Email delivery requires a Resend API key and a verified sender domain. The local backend stores registrations in `data/switch.db`.

## Deploy the testnet contract

Set `PRIVATE_KEY` in an ignored `.env` file or a secure secret store, then run:

```sh
bun run contracts:deploy:testnet
```

The active testnet deployment uses a seven-day minimum inactivity window. The deployment script checks chain ID `420420777` before broadcasting and applies a Portaldot-specific gas-estimate multiplier. For a future redeployment, verify the estimate and signer balance first, then update both app address variables to the newly verified contract. Never commit private keys or production secrets.

## Production configuration

Copy the relevant values from `.env.example` into the web and backend deployment environments. The Next.js web app can be deployed on Vercel; the Bun notification server is a separate service and is not deployed by Vercel with this app. Email reminders require that server, a durable database volume, and a verified Resend sender. Until it is hosted, core on-chain vault features work, but email reminder registration is unavailable.

- Web: `NEXT_PUBLIC_EVM_RPC` and `NEXT_PUBLIC_SWITCH_ADDRESS`. Set `NEXT_PUBLIC_API_URL` to the hosted notification server URL when that service is available.
- Backend: `EVM_RPC`, `CHAIN_ID`, `SWITCH_ADDRESS`, `EXPLORER_URL`, `ALLOWED_ORIGINS`, `RESEND_API_KEY`, and `EMAIL_FROM`. Set `ALLOWED_ORIGINS` to the exact frontend origin.
- If the backend runs separately, set `ALLOWED_ORIGINS` to the exact web-app origin. Production persistence needs a durable volume for `data/switch.db`.

## Build commands

```sh
bun run typecheck
bun run build
bun run contracts:build
```

## Repository notes

- `contracts/SwitchVault.sol` is the Portaldot implementation used by the active app.
- `src/lib/contract.ts` and `server/contract-config.ts` hold the matching frontend/backend chain and ABI configuration.
- The old `Afterlife.sol`, Arc deployment metadata, and Arc-specific tooling are retained as upstream history. They do not back the SWITCH app and must not be used to deploy SWITCH.
- `src/onchain-facts.ts`, `src/onchain-money.ts`, and `src/onchain-wait.ts` are inherited generated Arc Studio files and are not part of SWITCH's active chain path.
