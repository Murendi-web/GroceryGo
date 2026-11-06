# GroceryGo

South African grocery planner for iOS and Android. React Native, Expo and TypeScript, with a Supabase backend.

## Structure

```
App.tsx                      Root: splash, onboarding, auth, tab navigation
index.ts                     Expo entry point
app.json  tsconfig.json  babel.config.js  .env.example

src/
  types/index.ts             Every shared type (StoreName, ListItem, Trip, BudgetPlan, ...)
  theme/index.ts             Colours, gradients, shadows, serif font
  data/
    prices.ts                Baseline prices (see "Data" below)
    categories.ts  meals.ts  specials.ts  nearby.ts  stores.ts
    catalog.ts               Builds the catalog, merges live prices over the baseline
  utils/
    pricing.ts               priceAt, lowestPrice, cheapestStore, parseModelJson
    plan.ts                  Validates AI budget plans and rebuilds the maths locally
    format.ts  validation.ts Currency/date helpers, email and SA phone checks
  services/
    supabase.ts              Client. Null when .env is empty (demo mode)
    ai.ts                    Calls the ai-chat Edge Function with the user's token
    aiTasks.ts               Chat, price estimate, suggestions, budget plan
    remote.ts                List, favourites, history and price sync
    storage.ts               AsyncStorage helpers
  context/
    AuthContext.tsx          Sign in, sign up, guest, sign out
    ShopContext.tsx          List, favourites, history, store, budget, toasts
  components/                Icon, ui primitives, ItemRow, StorePicker, Toast
  screens/                   Splash, Onboarding, Auth, Home, Meals, List, Deals, More,
                             Chat, Locator, Favs, History, Share, Profile,
                             AddItemSheet, AdvisorSheet

supabase/
  schema.sql                 Tables, row level security, triggers
  functions/ai-chat/index.ts Authenticated, rate-limited Anthropic proxy (Deno)
  tests/                     RLS test, Edge Function test, local auth stub

scraper/                     Playwright price scraper (own package.json)
.github/workflows/           Weekly scrape, Sundays 02:00 SAST
tests/                       Logic tests for pricing, validation, plan checks
```

## Run the app

```bash
npm install
npx expo install --fix     # aligns native package versions with your Expo SDK
npx expo start
```

Scan the QR code with Expo Go. If Expo Go reports an incompatible SDK, update Expo Go from the store.

With no `.env`, the app runs in **demo mode**: accounts live on the device, nothing syncs, and the AI features show a setup message. Everything else works.

## Turn on the backend

1. Create a Supabase project (region `af-south-1`, Cape Town).
2. SQL Editor: run `supabase/schema.sql`.
3. Authentication > Providers: enable **Anonymous sign-ins** (guest mode needs it). Turn on CAPTCHA or keep the default sign-in rate limits so nobody can mass-create guests.
4. Deploy the AI function:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy ai-chat
   ```
5. Copy `.env.example` to `.env`, fill in the three values, restart Expo.

The Anthropic key lives only in Supabase secrets. The app never holds it. Free users get 15 AI messages per 24 hours and Pro users 200, enforced on the server from the database. `GLOBAL_DAILY_CAP` (default 2000) limits total spend.

To mark someone Pro, run `update profiles set is_pro = true where email = '...'` in the SQL editor. Users cannot change this themselves.

## Live prices

```bash
cd scraper && npm install && npx playwright install chromium
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run scrape
```

Add the same two values as GitHub repository secrets to enable the weekly workflow.

**Before you trust it:** the CSS selectors in `scraper/scrape-prices.ts` are starting points and are untested against the live sites. Open each store in a browser, inspect a product card, and fix them. Some retailers block automated traffic or forbid scraping in their terms, so read those first. The scraper only writes prices it read, and rejects any price outside 40% to 250% of the baseline, so a wrong match is unlikely to land in the database.

## Tests

```bash
npm run typecheck                                   # strict TypeScript, app
npm test                                            # pricing, validation, plan checks, scraper parsing
cd supabase/tests && deno run -A edge-function.test.ts   # Edge Function with mocked Supabase and Anthropic
```

`supabase/tests/rls.test.sql` checks the security rules on a local Postgres. Load `auth-stub.sql` first, then `schema.sql`, then the test.

## Data

- **Baseline prices** in `src/data/prices.ts` are estimates written from general knowledge of 2025 SA retail pricing. They are not scraped and not sourced from a published dataset. Treat them as placeholders until the scraper runs.
- **Specials** and **store distances** are sample data, labelled as such in the app.
- Models are set by `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`).

## Not built yet

Push notifications, family sharing, barcode scanning, GPS store lookup, password reset, Google sign-in. The More tab lists these as coming soon.

Add `icon` and `splash.image` entries to `app.json` before a store build.
