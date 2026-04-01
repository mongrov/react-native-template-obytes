> This project was generated from the [Obytes React Native Template](https://github.com/obytes/react-native-template-obytes), a production-ready React Native starter with modern tooling and best practices.

## What: Technology Stack

- **Expo SDK 54** with React Native 0.81.5 - Managed React Native development
- **TypeScript** - Strict type safety throughout
- **Expo Router 6** - File-based routing (like Next.js)
- **TailwindCSS** via Uniwind/Nativewind - Utility-first styling for React Native
- **@mongrov/auth** - Authentication state machine (AuthProvider, useAuth, useSession)
- **@mongrov/theme** - Design tokens & dark mode (ThemeProvider, useColorScheme, useNavigationTheme)
- **@mongrov/core** - Structured logging (LoggingProvider, useLogger)
- **Zustand** - Lightweight global state management (non-auth state only)
- **React Query** - Server state and data fetching
- **TanStack Form + Zod** - Type-safe form handling and validation
- **MMKV** - Encrypted local storage
- **Jest + React Testing Library** - Unit testing

## What: Project Structure

```
src/
├── app/              # Expo Router file-based routes (add new routes here)
├── features/         # Feature modules - auth, feed, settings are EXAMPLES
├── components/ui/    # Pre-built UI components (button, input, modal, etc.)
├── lib/              # Pre-configured utilities (api, auth, theme, i18n, storage)
├── translations/     # i18n files (en.json, ar.json - add more languages)
└── global.css        # TailwindCSS configuration

Root Files:
├── env.ts           # Environment config (CUSTOMIZE bundle IDs, API URLs)
├── app.config.ts    # Expo configuration
└── README.md        # Project-specific documentation
```

## How: Development Workflow

**Essential Commands:**
```bash
pnpm start              # Start dev server
pnpm ios/android        # Run on platform
pnpm lint               # ESLint check
pnpm type-check         # TypeScript validation
pnpm test               # Run Jest tests
pnpm check-all          # All quality checks
```

**Environment-Specific:**
```bash
pnpm start:preview              # Preview environment
pnpm ios:production             # Production iOS
pnpm build:production:ios       # EAS production build
```

## How: Key Patterns

- **Create features**: New folder in `src/features/[your-feature]/` with screens, components, API hooks
- **Add routes**: Create files in `src/app/` (file-based routing)
- **Forms**: Use TanStack Form + Zod (see `src/features/auth/components/login-form.tsx`)
- **Data fetching**: Use React Query (see `src/features/feed/api.ts`)
- **Auth**: Use `@mongrov/auth` — `useAuth()` for signIn/signOut/status, `useSession()` for user info (see `src/lib/auth/`)
- **Theme/Dark mode**: Use `@mongrov/theme` — `useColorScheme()` for dark/light, `useTheme()` for tokens (see `src/lib/theme/`)
- **Auth adapter**: Implement `AuthAdapter` in `src/lib/auth/adapter.ts` (swap demo for real backend)
- **Global state**: Use Zustand for non-auth state
- **Styling**: NativeWind/Tailwind classes (see `src/components/ui/button.tsx`)
- **Storage**: Use MMKV via `src/lib/storage.tsx` for non-auth data
- **Imports**: Always use `@/` prefix, never relative imports

## How: Essential Rules

- ✅ **DO** use absolute imports: `@/components/ui/button`
- ✅ **DO** follow feature-based structure: `src/features/[name]/`
- ✅ **DO** use TanStack Form for forms (not react-hook-form)
- ✅ **DO** use MMKV storage for sensitive data (not AsyncStorage)
- ✅ **DO** use EAS Build for production: `pnpm build:production:ios`
- ✅ **DO** prefix env vars with `EXPO_PUBLIC_*` for app access
- ❌ **DO NOT** modify `android/` or `ios/` directly (use Expo config plugins)
