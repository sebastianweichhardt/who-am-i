# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Supabase setup

Themes and prompts are stored in Supabase and read by the app with a public,
read-only policy.

1. Open the Supabase SQL Editor and run
   `supabase/migrations/202608240001_create_themes.sql`. This creates the
   `themes` and `theme_prompts` tables, enables row-level security, and imports
   the starter catalog.
2. Run `supabase/migrations/202608240002_create_custom_themes.sql`. This adds
   private, user-owned custom themes and entries, row-level security policies,
   and the atomic function used by the creation screen.
3. Copy `.env.example` to `.env.local`.
4. In the Supabase dashboard, open the project Connect dialog and add the
   project URL and publishable key to `.env.local`:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
   ```

5. Reload Expo Go after starting Metro with `npx expo start --clear`.

Never put a Supabase secret key or legacy `service_role` key in an
`EXPO_PUBLIC_` variable. The publishable key is intended for client apps; data
access is enforced by the database policies in the migration.

## Sign in with Apple

The app uses native Sign in with Apple and stores the resulting session in
Supabase Auth.

1. In Supabase, open Authentication > Providers > Apple and enable the
   provider.
2. While testing in Expo Go, add `host.exp.Exponent` to the Apple provider's
   Client IDs list. Expo Go uses that identifier instead of your future app
   bundle identifier.
3. For a standalone iOS build, choose an `ios.bundleIdentifier`, enable Sign in
   with Apple for the matching App ID in the Apple Developer portal, and add
   that bundle identifier to Supabase's Client IDs list.
4. Restart Metro with `npx expo start --clear` and test on a physical iPhone or
   iPad.

The native-only flow does not require adding an Apple secret to the Expo app.
Keep Apple signing keys and Supabase secret keys out of the repository.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
