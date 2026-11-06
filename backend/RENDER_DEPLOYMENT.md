# Deploy the CampusDeals backend to Render

This guide deploys the Django REST API on Render, uses Supabase for PostgreSQL,
and uses Cloudinary for uploaded media. The frontend is deployed separately.

## Before you start

Have the following ready:

- A GitHub repository connected to Render
- A Supabase project
- A Cloudinary account
- A Google OAuth **Web application** client ID if Google sign-in is enabled
- A Paystack secret key if payments are enabled
- The public URL of the deployed frontend

Do not put database passwords, API secrets, or production Django keys in Git.
Enter them only in Render's environment settings.

## Deploy with the Blueprint

The repository root contains `render.yaml`, which defines the backend web
service and its build/start commands.

1. In Render, choose **New + → Blueprint** and connect this repository.
2. Select the branch to deploy. Render reads the root `render.yaml` and creates
   the `campusdeals-backend` service.
3. During setup, enter the environment values requested for variables marked
   `sync: false` (listed below). Keep each secret private.
4. Start the deployment and check the service's **Events** and **Logs** tabs.
   The build installs Python dependencies, collects static files, and runs
   database migrations before starting Gunicorn.
5. Once deployed, note the service URL, for example
   `https://campusdeals-backend.onrender.com`.

The Blueprint sets `backend/` as the service root directory, uses Python
3.12.3, sets `DJANGO_DEBUG=0`, enables Cloudinary, and generates
`DJANGO_SECRET_KEY`.

### If creating a web service manually

Use these Render settings:

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate` |
| Start Command | `gunicorn campusdeals_api.wsgi:application --bind 0.0.0.0:$PORT --log-file -` |

Set the environment variables below in **Environment**.

## Configure Supabase PostgreSQL

1. Open the Supabase project and choose **Connect**.
2. Copy the PostgreSQL **Session pooler** connection string (port `5432`) for
   the Render service.
3. In Render's backend service, set `DATABASE_URL` to that connection string.
   Confirm it uses SSL; add `sslmode=require` if it is not already present.
4. Save the setting. Render will redeploy, and the build command will run
   `python manage.py migrate` against Supabase.

Use the URL-encoded password if the database password includes reserved URL
characters. Keep the connection string secret. The first deployment creates
the schema, but does **not** copy existing data from SQLite. Back up/import
records separately if needed.

## Configure Cloudinary media

Find these values in the Cloudinary console and set them in Render:

| Variable | Value |
| --- | --- |
| `USE_CLOUDINARY` | `1` (already set by the Blueprint) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

The backend uses Cloudinary for uploaded images and WhiteNoise for static
files. Existing images in local storage are not copied automatically; upload
or migrate any images that need to remain available. Never expose the API
secret in the frontend.

## Environment variables

Configure these for the backend service in Render:

| Variable | Required | Notes |
| --- | --- | --- |
| `PYTHON_VERSION` | Yes | Set to `3.12.3` as in the Blueprint |
| `DJANGO_DEBUG` | Yes | Must be `0` in production |
| `DJANGO_SECRET_KEY` | Yes | Generate a strong, private value; the Blueprint generates it |
| `DJANGO_ALLOWED_HOSTS` | Yes | The Blueprint allows `*.onrender.com`; update if using a custom API domain |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Yes | The Blueprint allows `https://*.onrender.com`; update for a custom domain if needed |
| `DATABASE_URL` | Yes | Supabase Session pooler PostgreSQL URL with SSL |
| `USE_CLOUDINARY` | Yes | Set to `1` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account value |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary account value |
| `CLOUDINARY_API_SECRET` | Yes | Secret; do not share or commit |
| `CORS_ALLOWED_ORIGINS` | Yes | Exact frontend origin(s), comma-separated, e.g. `https://campusdeals.example.com` |
| `GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth Web application client ID |
| `PAYSTACK_SECRET_KEY` | For payments | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | For payments | Paystack public key |
| `PAYSTACK_CALLBACK_URL` | Optional | Payment return URL |

`CORS_ALLOWED_ORIGINS` should contain the frontend origin, including its
scheme, but no path. For example, use `https://shop.example.com`, not
`https://shop.example.com/store`.

## Configure Google sign-in

1. In Google Cloud Console, create or select an OAuth client of type **Web
   application**.
2. Add the deployed frontend URL to **Authorized JavaScript origins** (and
   `http://localhost:3000` for local development).
3. Set the client ID as `GOOGLE_CLIENT_ID` in the Render backend environment.
4. Set the same client ID as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the frontend
   hosting provider and redeploy the frontend.

The backend validates the Google ID token against its configured client ID.
The frontend variable only enables the Google sign-in button.

## Create an administrator

After the backend is deployed and migrations have completed, open the Render
service's **Shell** and run:

```shell
python manage.py createsuperuser
```

Follow the prompts. Keep the admin password private.

## Verify the deployment

- Check the Render logs for a successful build, migrations, and Gunicorn startup.
- Open the API base, for example
  `https://campusdeals-backend.onrender.com/api/store/products/`. The public
  products endpoint should return a JSON response (an empty result is normal
  for a new database).
- Check the frontend can call the API. If browser requests are blocked, verify
  `CORS_ALLOWED_ORIGINS` exactly matches the deployed frontend origin.
- Upload a test product image from the admin dashboard and confirm its image
  URL is served by Cloudinary.
- If Google sign-in is enabled, verify both client ID settings match and the
  frontend origin is authorized in Google Cloud Console.

## Updating the deployment

Push changes to the branch connected to Render. Render rebuilds the service;
the build command installs dependencies, collects static files, and applies
database migrations.

For custom domains, update `DJANGO_ALLOWED_HOSTS`,
`DJANGO_CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS` in Render to match
the actual backend and frontend domains.

For local development and the full project overview, see the
[root README](../README.md) and [backend README](README.md).
