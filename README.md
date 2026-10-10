# CineBox — starter streaming catalogue

A mobile-friendly React/Vite starter for a Hindi + English movie and web-series catalogue. It uses YouTube embeds for playback and Supabase for authentication/database. Only publish videos you own or are licensed to distribute.

## Included
- Responsive dark streaming-style catalogue
- Movie / series filters and search
- YouTube embedded player and thumbnail fallback
- Hindi / English interface toggle
- Admin sign-in and admin-only add/delete form
- Supabase row-level security policies in `supabase/schema.sql`
- Demo preview cards before Supabase is configured

## Free-tier expectations
This is a starter, not unlimited free streaming infrastructure. Hosting, database, bandwidth, and third-party free tiers have quotas and terms that can change. YouTube may show its own branding/ads and a video owner can disable embedding. Do not download, rehost, or embed videos without the necessary rights/permission. Never promise a movie is available if the owner has disabled playback.

## 1. Create Supabase project
1. Create a project at https://supabase.com/.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it.
3. In **Authentication → Users**, create your admin user (or use the sign-up flow only if you have built one; this starter intentionally has no public sign-up).
4. Open the new user and copy its UUID.
5. In SQL Editor, assign admin role:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('PASTE-AUTH-USER-UUID-HERE', 'admin')
   on conflict (user_id) do update set role = 'admin';
   ```
6. In Project Settings / API, copy the Project URL and the **publishable/anon key**. Do not use the `service_role` or secret key in the browser.

## 2. Run locally
Install Node.js on a computer, then in this folder run:
```bash
npm install
cp .env.example .env.local
```
Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```
Then:
```bash
npm run dev
```
Open the local URL shown by Vite. On Android only, you can edit files in a browser-based development environment that supports Node/Vite, but initial setup is generally easier on a computer.

## 3. Deploy for free on Netlify
1. Push this folder to a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project**, and connect that repository.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. In Netlify site environment variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values.
6. Redeploy the site.
7. Use the generated `*.netlify.app` address to test. A custom domain is optional and usually costs money.

## 4. Add a title from the Admin panel
1. Sign in with the admin email/password you created in Supabase.
2. Choose **Admin** in the website header.
3. Enter title, type, year, genre, description, and a YouTube video URL.
4. Optionally provide a poster image URL.
5. Check **Published** and choose Publish title.
6. The title should appear in the public catalogue.

Accepted YouTube link examples:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

Use a video where embedding is allowed. The thumbnail uses YouTube's standard thumbnail endpoint unless you enter a poster URL.

## Security notes
- The browser bundle contains only the public/anon key, which is expected; database RLS policies enforce permissions.
- Never publish the Supabase `service_role` key, database password, or other secret.
- Create/admin-assign accounts only for people you trust.
- This starter includes add and delete. Updating existing titles and multi-episode season management are natural next features.
- The demo cards are sample placeholders, not a promise of rights or availability. They are replaced with database records once Supabase is configured.
- Before a public launch, add privacy/contact pages, abuse/takedown contact, stronger form validation, logging, and test RLS with a non-admin account.

## Troubleshooting
- **Setup banner stays visible:** check `.env.local` locally or Netlify environment variables and redeploy.
- **Login succeeds but admin panel denies access:** verify the exact `auth.users.id` is present in `public.user_roles` with role `admin`.
- **Videos won't play:** the video may disallow embedding, be private, age-restricted, deleted, or unavailable in your region.
- **No catalogue:** check the browser console and Supabase table/policies; make sure records are published.
