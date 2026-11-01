# Indo-Armenia Community Registry

A React and TypeScript registry for Indo-Armenian community members, with member registration and verification, an administrator portal, emergency alerts, encrypted backups, and optional Google Sheets synchronization.

## Technology

- React, TypeScript, Vite, and Tailwind CSS for the browser application.
- Firebase Authentication for administrator sign-in.
- Cloud Firestore for registry data, accessed only by the server API.
- Netlify Functions with Firebase Admin SDK for protected API operations.

## Deploy to Netlify

1. Push this repository to GitHub and import it in Netlify.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`, Node.js 22. The `/api/*` rewrite sends API calls to the Netlify Function.
3. Add these environment variables in Netlify site settings:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: the Firebase service account JSON as one-line JSON. Keep it private; do not commit it.
   - `MEMBER_SESSION_SECRET`: a random secret of at least 32 characters.
   - `ADMIN_EMAIL`: the administrator's email address.
4. In Firebase Authentication, enable email/password sign-in and create/verify the admin account. The email must match `ADMIN_EMAIL`.
5. Confirm Firestore is enabled in the Firebase project referenced by `firebase-applet-config.json`.

The Firebase web config in the repository identifies the Firebase project; the service account credential stays in Netlify. Firestore security rules deny direct browser access because all database reads and writes go through the function.

## Local development

```sh
npm install
npm run dev
```

The UI can be previewed with Vite, but authenticated API features require Netlify Functions and the server environment variables above. Use Netlify CLI (`netlify dev`) for a local full-stack run.

## Current deployment notes

- No live deployment or custom-domain/DNS changes are made by this repository setup.
- Configure the three server variables before expecting registration, administrator, SOS, or directory API operations to work.
- The optional Apps Script webhook must be deployed as a Google Apps Script web app and its URL saved in the admin portal. CSV export is the manual alternative.
