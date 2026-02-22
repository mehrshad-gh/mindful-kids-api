# Mindful Kids – Mobile App

React Native (Expo) app with **dual-role** flows: **Parent** and **Child**.

## Structure

```
mobile/
├── App.tsx                 # Entry: AuthProvider + NavigationContainer + RootNavigator
├── app.json
├── package.json
├── src/
│   ├── components/
│   │   ├── layout/         # ScreenLayout (SafeArea + optional ScrollView)
│   │   └── ui/             # Button, Input, Card (reusable)
│   ├── context/
│   │   └── AuthContext.tsx  # user, appRole, login, register, logout, setAppRole
│   ├── navigation/
│   │   ├── RootNavigator   # Auth stack | (RoleSelect → App)
│   │   ├── AuthNavigator   # Login, Register
│   │   ├── AppSwitch       # Renders Parent or Child based on appRole
│   │   ├── ParentNavigator # Bottom tabs: Dashboard, Advice, Library, Experts, Progress
│   │   └── ChildNavigator  # Bottom tabs: ActivityHub, Activity, Reward, CalmTools
│   ├── screens/
│   │   ├── auth/           # Login, Register, RoleSelect
│   │   ├── parent/         # Dashboard, AdviceFeed, ContentLibrary, PsychologistDirectory, ChildProgress
│   │   └── child/          # ActivityHub, Activity, Reward, CalmTools
│   ├── theme/              # colors, spacing
│   └── types/              # navigation.d.ts, auth.d.ts
```

## Flows

- **Auth:** Login / Register → then **Role Select** (Parent vs Child) → **App** (Parent or Child UI).
- **Parent mode:** Dashboard, Advice feed, Content library, Psychologist directory, Child progress. “Use app as Child” switches to Child mode.
- **Child mode:** Activity hub, Activity, Reward, Calm tools. “Back to Parent mode” switches to Parent mode.

## Run

```bash
cd mobile
npm install
npx expo start
```

Then open in iOS simulator, Android emulator, or Expo Go.

## API

Auth and data are intended to use the **mindful-kids-api** in the repo root. Replace the mock login/register in `src/context/AuthContext.tsx` with real calls to your API (e.g. `POST /auth/login`, `POST /auth/register`).

## Reusable pieces

- **Theme:** `src/theme/colors.ts`, `src/theme/spacing.ts`
- **UI:** `Button`, `Input`, `Card` in `src/components/ui/`
- **Layout:** `ScreenLayout` in `src/components/layout/`
- **Auth:** `useAuth()` from `AuthContext` for user, role, and switching mode
