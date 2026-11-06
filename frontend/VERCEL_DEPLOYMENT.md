# Deploy the CampusDeals frontend to Vercel

This guide deploys the Next.js frontend to Vercel. The Django API remains a
separate service deployed on Render.

## Before you start

- Push the repository to GitHub and connect it to Vercel.
- Deploy the backend to Render and note its public service URL, for example
  `https://campusdeals-backend.onrender.com`.
- If enabling Google sign-in, have the Google OAuth **Web application** client
  ID used by the backend.

## Create the Vercel project

1. In Vercel, choose **Add New → Project** and import the CampusDeals GitHub
   repository.
2. Set **Root Directory** to `frontend`.
3. Use the detected Next.js framework settings. The frontend package scripts
   provide `npm run build`; Vercel installs dependencies from
   `frontend/package-lock.json`.
4. Add the environment variables below for **Production**. Add them to Preview
   and Development environments too if those deployments need the API or
   Google sign-in.
5. Deploy the project and note the resulting Vercel URL.

## Environment variables

| Variable | Required | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_BACKEND_ORIGIN` | Yes | Public Render backend origin, e.g. `https://campusdeals-backend.onrender.com`. Do not include a path or trailing slash. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google sign-in | The same Google OAuth Web client ID configured as `GOOGLE_CLIENT_ID` on the Render backend. |

`NEXT_PUBLIC_API_URL` is optional and normally should be left unset. The API
client defaults to `/api`, and the Next.js rewrite forwards it to the backend.
Never put private credentials in `NEXT_PUBLIC_*` variables: they are included
in browser-accessible frontend code.

After changing environment variables, redeploy so they are available during
the Next.js build.

## Connect the Vercel domain to the backend

The Render backend must allow browser requests from the deployed frontend:

1. Copy the exact Vercel origin, including `https://` and excluding any path or
   trailing slash. For example, use
   `https://campusdealsgh.vercel.app`.
2. In Render, set the backend's `CORS_ALLOWED_ORIGINS` to that exact origin.
   For multiple frontend domains, use comma-separated origins without paths
   or trailing slashes.
3. Save the Render environment setting and redeploy/restart the backend if
   prompted.

The frontend's `/api/*` and `/media/*` requests are proxied by the Next.js
rewrites to `NEXT_PUBLIC_BACKEND_ORIGIN`. Uploaded media is served from
Cloudinary by the backend.

If you attach a custom domain to Vercel, add that domain's origin to
`CORS_ALLOWED_ORIGINS` as well. If a browser request is blocked, check the
browser console and verify the configured origin exactly matches the page URL's
scheme and host.

## Configure Google sign-in

1. In Google Cloud Console, open the OAuth client used by this project.
2. Add the Vercel production origin (for example
   `https://campusdealsgh.vercel.app`) to **Authorized JavaScript origins**.
3. Add any custom frontend domain origins used by the application. Google
   requires authorized origins to be specified explicitly.
4. Set the OAuth client ID as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Vercel and as
   `GOOGLE_CLIENT_ID` in the Render backend environment.
5. Redeploy the frontend and backend after updating the settings.

The Google client ID is public by design. The backend verifies each Google
ID token; do not put a Google client secret in the frontend.

## Verify the deployment

- Open the Vercel production URL and check that the home page renders.
- Open the storefront and confirm API data loads from the Render backend.
- Check browser developer tools for CORS or failed API/media requests.
- Test login and registration. If enabled, test Google sign-in.
- Upload or view an image and confirm its URL is served by Cloudinary.

## Subsequent deployments

Vercel automatically builds deployments when changes are pushed to the
connected Git branch. Configure the production branch in Vercel's Git settings;
other branches can create preview deployments.

For local development and backend deployment, see the
[root README](../README.md) and [Render backend deployment guide](../backend/RENDER_DEPLOYMENT.md).
