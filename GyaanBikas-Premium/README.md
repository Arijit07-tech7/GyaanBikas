# GyaanBikas — Premium Learning & Knowledge App

A real Supabase-powered personal learning notes app.

## Stack
- HTML / CSS / JavaScript
- Supabase Auth
- Supabase PostgreSQL + RLS
- PWA manifest
- No fake notes or statistics

## Database expected
The app uses the existing:
- `profiles`
- `learning_notes`

The frontend uses the Supabase publishable key only. Never put a `service_role` key in browser code.

## Run locally
Use any static server from this folder, for example:

```powershell
npx serve . -l 3000
```

Then configure Supabase Authentication URL Configuration with:
- `http://localhost:3000`
- `http://localhost:3000/**`

Google OAuth must have the Supabase callback configured in Google Cloud:
`https://ljwpxjioetqabsrgwmmq.supabase.co/auth/v1/callback`

## Notes
Images pasted into the editor are currently stored inside the note HTML as data URLs. This makes the prototype fully functional without requiring a separate Storage bucket. For large production images, move image blobs to Supabase Storage later.


## Authentication setup — GyaanBikas

This build uses the Supabase Publishable API key in `js/supabase.js` and keeps the key client-safe.

### Google Login
In Supabase:
1. Authentication → Providers → Google → enable Google.
2. Configure the Google OAuth Client ID/Client Secret from Google Cloud.
3. In Authentication → URL Configuration add:
   - `http://localhost:3000`
   - `http://localhost:3000/**`
4. Supabase's Google callback remains:
   `https://ljwpxjioetqabsrgwmmq.supabase.co/auth/v1/callback`

The app uses Supabase OAuth with PKCE and redirects back to the running GyaanBikas app.

### If the browser still says "Invalid API key"
Hard refresh with `Ctrl + Shift + R`. This build cache-busts the local Supabase module and pins the Supabase JS client version. Do not put a secret/service-role key in the browser.
