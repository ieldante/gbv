# @gbv/extension

MV3 GBV browser client.

## Components

- popup UI (`src/popup/*`)
- background service worker (`src/background.ts`)
- content script (`src/contentScript.ts`)
- flow orchestration (`src/lib/gbvFlow.ts`)

## Build

From repo root:

- `corepack pnpm build:extension`

Build output:
- `apps/extension/build`

## Load in Chrome

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Load unpacked -> `apps/extension/build`

## Runtime Flow

popup -> background -> content script -> page context -> background -> server

All host permissions and protocol constants come from `gbv.config.ts`.
