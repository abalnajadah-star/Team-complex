# TEAM COMPLEX — Complete website project

A professional Rocket League esports website with 11-field recruitment, protected staff review dashboard, Discord application notifications, and a real YouTube public subscriber counter refreshed every 60 seconds. No demo applications or fake subscriber numbers.

## Run locally
1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in the credentials below. NEVER commit `.env`.
4. Run `npm start` and open http://localhost:3000.

## Configure database and staff
1. Create a free Supabase project at https://supabase.com.
2. In SQL Editor, run `supabase/schema.sql`.
3. Copy project URL, anon/publishable key and service-role key into `.env`. The service-role key is secret and MUST be server-side only.
4. In Supabase Authentication, create/invite staff users (turn off public self-signup in Auth settings). Confirm emails if required.
5. In Supabase SQL Editor, insert each authorized user's auth UUID into the `staff` table with role `owner` or `staff`, e.g. `insert into public.staff(user_id,role) values ('UUID_HERE','owner');`.
6. The dashboard denies access to users not in the staff table, even if they can authenticate.

## Live YouTube subscribers
1. Open Google Cloud Console, create a project, enable **YouTube Data API v3** and create an API key restricted to that API.
2. Get the actual channel ID for https://youtube.com/@team_complex from YouTube Studio / channel details (not the handle itself). Set `YOUTUBE_CHANNEL_ID` and `YOUTUBE_API_KEY` in `.env`.
3. The server caches subscriber counts for 60 seconds. YouTube rounds public counts, so the value may not change on every new subscription.

## Discord notifications
1. In your private Discord staff channel, open channel settings > Integrations > Webhooks > New Webhook.
2. Copy the webhook URL into `DISCORD_WEBHOOK_URL` in `.env`. Never expose the webhook publicly.
3. Notifications contain a short summary; complete application details stay in the protected dashboard.

## Hosting
Deploy to any Node.js host supporting environment variables and persistent HTTPS service (e.g. Render, Railway, or a VPS). The database lives in Supabase, not on the host's disk. Configure the same `.env` keys in the host's secret settings. Free tiers, sleep policies, and usage limits vary by provider. Set `npm start` as the start command. Connect a domain when ready.

## Privacy and launch checklist
Applications collect Discord usernames and ages. Get an appropriate privacy notice and retention policy before public launch; consider using age brackets instead of exact age. Do not collect applicants under 13. Add a CAPTCHA and stricter anti-spam measures if the form attracts abuse. Keep all secret keys server-side, and restrict access to staff. Test an application, Discord notification, staff login, status update and YouTube count before publishing.

## Important
This ZIP is a complete runnable application, not an already deployed website. Without the Supabase, YouTube and Discord credentials, the corresponding live features display an honest not-connected message. No passwords or API keys should be pasted into a public chat.
