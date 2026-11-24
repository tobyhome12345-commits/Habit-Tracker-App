# ✅ Habit Tracker, with Pip 🌱

A free, offline habit tracker for Android: no ads, no account, no subscription. Everything stays on your phone.

<img src="docs/screenshots/today.png" width="420" alt="Today screen with Pip, light and dark"> <img src="docs/screenshots/celebrate.png" width="420" alt="Perfect day celebration">

## Meet Pip

**Pip** is a sunflower seed who's upbeat, a bit goofy and always on your side. He never guilt-trips you: streaks restart, and that's okay.

- **Pip evolves with you.** Your best current streak changes his whole body, and he gets bigger at every stage:
  🌰 **Seed** (0–2 days) → 🌱 **Sprout** (3+) → 🌿 **Sapling** (7+, leaf arms) → 🌷 **Bud** (14+) → 🌻 **Bloom** (30+, a full sunflower).
- **Pip reacts to your day.** He's happy in the morning, cheers you on once you've started, celebrates a perfect day and gets sleepy late at night. All 5 moods work at every stage.
- You'll find him on Today, in streak-milestone pop-ups, the empty states, Stats ("Pip's take"), the splash screen and the app icon.

<img src="docs/screenshots/pip.png" width="700" alt="Pip's five evolution stages and five moods">

<img src="docs/screenshots/evolution.png" width="560" alt="Pip evolving in the app: seed, sapling, bud, bloom">

## Features

- **Habits your way**: name, emoji (pick one or type any emoji) and colour from a 10-tone garden palette.
- **Daily check-off**: a big tap target with a check that draws itself in, a 🔥 **current streak**, a 🏆 **best streak**, and confetti when you finish the day.
- **Streak milestones** at 3, 7, 14, 21, 30, 50, 100… days.
- **Fix missed days** by tapping any day in the 7-day strip or the calendar.
- **Calendar + heatmap**: a month view where streaks join into pills, plus a 22-week heatmap, for one habit or all of them.
- **Weekly & monthly stats**: completion %, change vs the last period, check-ins, perfect days, a daily bar chart and a per-habit leaderboard.
- **Works offline.** Data is saved on the device, with **Export / Import** backups.
- **Light, dark or automatic theme**, built for phones. Respects "reduce motion".

<img src="docs/screenshots/calendar.png" width="420" alt="Calendar view"> <img src="docs/screenshots/stats.png" width="420" alt="Stats view">

## 📲 Install on your Android phone

1. On your phone, open **https://github.com/tobyhome12345-commits/Habit-Tracker-App/releases/latest**
2. Under **Assets**, tap **`HabitTracker.apk`** to download it.
   (Direct link: https://github.com/tobyhome12345-commits/Habit-Tracker-App/releases/latest/download/HabitTracker.apk)
3. Open the downloaded file. If Android asks, allow **"Install unknown apps"** for your browser (Chrome → *Settings* → toggle **Allow from this source**), then go back.
4. Tap **Install**. If Google Play Protect warns about an unknown app, tap **More details → Install anyway**. (It says this for any app that isn't from the Play Store.)
5. Open **Habit Tracker** 🎉

**Updating:** download the newest `HabitTracker.apk` the same way and install it over the top. Your habits and streaks are kept.

> ⚠️ Uninstalling the app deletes its data. Use **Settings → Export** first if you ever need to uninstall.

## How it's built

- **React + TypeScript + Vite** web app, wrapped as a native Android app with **Capacitor 8**.
- **Design system:** "Garden notebook". Warm paper + ink by day, a night garden in dark mode. Fredoka + Nunito fonts (bundled, so they work offline). Tokens live in `src/styles/global.css`.
- **Pip** is drawn in code: `src/mascot/pip.ts` returns his SVG for any mood and growth stage. `src/mascot/mood.ts` decides his mood, messages, growth and milestones (all unit-tested).
- Storage: `@capacitor/preferences`, on the device, no server.
- **GitHub Actions** (`.github/workflows/build-apk.yml`) runs the tests and builds a signed APK on every push, then publishes it as a GitHub Release.
- The APK is signed with `android/app/habit-tracker.keystore`. It's committed on purpose, so every build has the same signature and updates install cleanly. It's a personal sideloading key, not a Play Store key.

### Developing

```bash
npm install
npm run dev        # web preview at http://localhost:5173
npm test           # unit tests (dates, streaks, stats, storage, Pip's moods)
npm run build      # production web build
npm run assets     # re-render app icon + splash images from Pip's SVG
npx cap sync android
```
