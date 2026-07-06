# ENS App — RA Tehsil Mobile (React Native CLI + Reusables)

React Native CLI field client for **RA E&S Tehsil** users. Built with [React Native Reusables](https://reactnativereusables.com) (NativeWind + shadcn-style components).

## Stack

- **React Native 0.86** (`ios/` + `android/`)
- **React Native Reusables** + NativeWind 4
- **React Navigation** (stack + tabs)
- **Offline-first** drafts via AsyncStorage + NetInfo sync

## Setup

```bash
cd Mobile
cp .env.example .env
npm install
bash scripts/with-brew-ruby.sh bundle install
npm run pods
```

## Run

```bash
npm run reset-metro   # optional — clear stale Metro processes
npm start             # Terminal 1
npm run ios           # or npm run android — Terminal 2
```

### iOS build fails after moving the project folder

If Xcode reports a missing `React-VFS.yaml` under an old path (e.g. `frontend/ensapp`), clear stale caches and reinstall pods:

```bash
rm -rf ios/build ~/Library/Developer/Xcode/DerivedData/ensapp-*
npm run pods
npm run ios
```

## Reusables CLI

Initialize components (already done for this project):

```bash
npx @react-native-reusables/cli@latest add -y button text input card badge label separator
npx @react-native-reusables/cli@latest doctor
```

## Who can sign in

Only users with role `RA_ES_TEHSIL`.

## Environment

```env
API_BASE_URL=http://localhost:3001/api
# Android emulator: http://10.0.2.2:3001/api
```
