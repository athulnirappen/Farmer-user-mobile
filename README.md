# Farmer mobile app

Buyer and farmer app, built with Expo (SDK 58), Expo Router and TanStack Query. It talks to the API in the sibling `back-end` repo.

## Run on the Android emulator

1. In `back-end`: `npm run db:up`, `npm run db:seed` (first time) and `npm run dev`.
2. Start the emulator, then in this folder: `npm install` and `npm run android`.

The emulator reaches the API at `10.0.2.2:3000` with no configuration. Expo Go must match the SDK: 58.x. Expo normally offers to update it, or update it from the Play Store.

## Run on a real phone

1. Copy `.env.example` to `.env.local` and put in your PC's Wi-Fi IP.
2. Run `npm start` and scan the QR code with Expo Go. The phone and PC must be on the same Wi-Fi.

## Signing in locally

No SMS is sent. The 6-digit code appears in the `back-end` log as `Development OTP generated`. Seeded phone numbers:

| Number (type this) | Who |
| --- | --- |
| 9800000001 | Approved farmer |
| 9800000002 | Pending farmer |
| 9800000003 | Buyer |

Any other number goes through registration. A code can be requested once a minute and five times an hour.

## Testing "Near me" on the emulator

The emulator's default position is in California, far from the seeded farms. Use a position near Thrissur (10.5276, 76.2144) from the emulator's Extended Controls > Location, then press Set Location.

## Checks

```
npm run typecheck
npm run lint
npx expo-doctor
```
