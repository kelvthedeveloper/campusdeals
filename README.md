# CampusDeals

CampusDeals is a student-focused campus marketplace. Students can browse and
order products, bid on auctions, book campus services, manage favorites, and
view their account activity. Administrators manage marketplace content and
users through the admin dashboard.

The project is a monorepo with a Next.js frontend and a Django REST API.
PostgreSQL can be configured through `DATABASE_URL` (including Supabase), and
Cloudinary can be used for uploaded media in hosted environments.

## Features

- Product storefront with categories, variants, stock, and favorites
- Auctions with active listings, bid history, and authenticated bids
- Service catalog and student bookings
- Shopping cart and order management
- Paystack payment initialization
- Username/password registration and login, JWT sessions, and Google sign-in
- Customer, staff, and admin roles with a separate admin dashboard
- Image uploads for products, auctions, services, and profile pictures

## Technology

| Area | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| API | Django 5.1, Django REST Framework |
| Authentication | Simple JWT; Google Identity Services ID-token verification |
| Database | SQLite locally by default; PostgreSQL through `DATABASE_URL` |
| Media | Local filesystem by default; optional Cloudinary or S3-compatible storage |
| Deployment | Render Blueprint for the backend; frontend deployed separately |

## Repository layout

```text
backend/
  apps/
    accounts/       Users, roles, authentication, and platform settings
    store/          Products, categories, variants, and favorites
    auctions/       Auctions and bids
    services/       Service catalog and bookings
    payments/       Orders and Paystack transactions
  campusdeals_api/  Django settings, root URLs, and WSGI/ASGI entry points
  media/            Local uploads when Cloudinary/S3 is disabled
  manage.py
  requirements.txt
frontend/
  src/app/          Next.js routes for storefront, auth, dashboard, and admin
  src/components/   Shared UI components
  src/context/      Authentication and cart state
  src/utils/        API client and shared utilities
render.yaml         Render Blueprint (backend service)
```

## Requirements

- Python 3.12 recommended (see `backend/runtime.txt`)
- Node.js and npm (see `frontend/package-lock.json`)
- Optional for hosted use: Supabase PostgreSQL, Cloudinary, Google OAuth, and
  Paystack accounts

## Local development

Run the backend and frontend in separate terminals.

### 1. Configure and run the backend

PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` as needed, then initialize the database and create an admin
account:

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

The backend reads `backend/.env` automatically (from the repository root; the
file is `.env` relative to the `backend/` directory). With the example settings it
uses the local SQLite database and stores uploads under `backend/media/`.
`backend/.env` is ignored by Git; do not commit credentials.

### 2. Configure and run the frontend

In another PowerShell terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Next.js rewrite sends
`/api` and `/media` requests to `NEXT_PUBLIC_BACKEND_ORIGIN`, which defaults to
`http://127.0.0.1:8000`.

The frontend `.env.local` file is ignored by Git. Use `.env.example` files as
templates; do not put secrets in `NEXT_PUBLIC_*` variables, because those
values are exposed to the browser.

## Environment configuration

### Backend

Use `backend/.env.example` as the local template. Important settings:

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django signing key; use a private random value outside local development |
| `DJANGO_DEBUG` | Set to `1` for local development and `0` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hostnames |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Comma-separated trusted HTTPS origins where needed |
| `DATABASE_URL` | Optional database URL; absent means the local SQLite database |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins allowed by the API |
| `USE_CLOUDINARY` | Set to `1` to store uploaded media in Cloudinary |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret; keep private |
| `USE_S3` | Optional S3-compatible storage switch when Cloudinary is disabled |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID used to verify Google ID tokens |
| `PAYSTACK_SECRET_KEY` | Paystack secret used to initialize transactions |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key for frontend/payment configuration |
| `PAYSTACK_CALLBACK_URL` | Optional Paystack return URL |

Variables set in the process environment take precedence over values loaded
from `.env`. Render settings should be configured in the Render dashboard.

### Frontend

Use `frontend/.env.example` as the local template:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BACKEND_ORIGIN` | Backend origin used by Next.js API/media rewrites |
| `NEXT_PUBLIC_API_URL` | Optional API base URL; defaults to `/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth web client ID used by the Google sign-in button |

For Google sign-in, configure the same OAuth web client ID as
`GOOGLE_CLIENT_ID` on the backend. In Google Cloud Console, allow the local
frontend origin (for example `http://localhost:3000`) and the deployed frontend
origin as authorized JavaScript origins.

## Database and media

### Supabase PostgreSQL

The backend uses SQLite if `DATABASE_URL` is unset. To use Supabase:

1. Create a Supabase project and copy its PostgreSQL connection string. For a
   long-running Django service, use the Supabase session pooler URL.
2. Set `DATABASE_URL` in the backend environment. Use the URL format accepted
   by `dj-database-url`, and enable SSL (for example `sslmode=require`).
3. Run migrations with `python manage.py migrate`.

The Render build command runs migrations automatically. Changing from SQLite
to PostgreSQL does not transfer existing data; migrate or import records
separately if they need to be retained.

### Uploaded media

Local development uses Django's local filesystem storage by default. Hosted
Render deployments are configured for Cloudinary. Set `USE_CLOUDINARY=1` and
provide the Cloudinary cloud name, API key, and API secret in the backend
environment. Static assets remain served through WhiteNoise.

Existing local media files are not moved to Cloudinary automatically. Re-upload
or migrate any images that need to remain available after switching storage.
S3-compatible storage is also supported through the `USE_S3` and `AWS_*`
settings when Cloudinary is disabled.

## API overview

API endpoints are mounted under `/api/`. Most endpoints require a JWT access
token; registration, login, Google sign-in, token refresh, and public catalog
reads are available without one. Admin-only operations require an admin/staff
account as enforced by the endpoint.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/google/`, `POST /api/auth/refresh/`, `GET /api/auth/me/`, `GET/PUT/PATCH /api/auth/profile/`, `POST /api/auth/password/change/` |
| Users/admin | `GET/POST /api/auth/users/`, `PATCH/DELETE /api/auth/users/<id>/`, `GET /api/auth/analytics/summary/`, `GET/PUT /api/auth/settings/` |
| Catalog | `GET /api/categories/`, `GET /api/store/categories/`, `GET/POST /api/store/products/`, `GET /api/store/products/<slug>/`, `PATCH/DELETE /api/store/products/<slug>/` |
| Favorites | `GET/POST /api/store/favorites/`, `DELETE /api/store/favorites/<product_id>/` |
| Category administration | `GET/POST /api/admin/categories/`, `PATCH/DELETE /api/admin/categories/<id>/`, `PATCH /api/admin/categories/<id>/status/` |
| Auctions | `GET /api/auctions/`, `GET /api/auctions/<id>/`, `POST /api/auctions/<id>/bid/` |
| Services | `GET /api/services/`, `GET/POST /api/services/bookings/`, `DELETE /api/services/bookings/<id>/`, `GET/POST /api/services/admin/services/`, `PATCH/DELETE /api/services/admin/services/<id>/`, `PATCH /api/services/admin/services/<id>/status/` |
| Orders/payments | `GET/POST /api/payments/orders/`, `GET/DELETE /api/payments/orders/<id>/`, `POST /api/payments/initialize/` |

See [backend/README.md](backend/README.md) for the detailed endpoint list and
deployment notes.

## Tests and checks

Run backend tests and Django checks:

```powershell
cd backend
python manage.py test
python manage.py check
```

Run frontend lint and production build:

```powershell
cd frontend
npm run lint
npm run build
```

## Deployment

### Backend on Render

The root `render.yaml` defines the Django backend service with `backend/` as
its root directory. It installs requirements, collects static files, runs
migrations, and starts Gunicorn. Configure the required secrets in Render's
Environment settings:

- `DATABASE_URL` for Supabase PostgreSQL
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
- `GOOGLE_CLIENT_ID` if Google sign-in is enabled
- `CORS_ALLOWED_ORIGINS` for the frontend domain
- `PAYSTACK_SECRET_KEY` if payments are enabled

The Blueprint generates `DJANGO_SECRET_KEY` and sets `DJANGO_DEBUG=0` and
`USE_CLOUDINARY=1`. Keep all credentials in Render's environment settings, not
in the repository.

### Frontend

Deploy `frontend/` as a separate Next.js application. Configure
`NEXT_PUBLIC_BACKEND_ORIGIN` to the deployed Django backend origin and set
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` if Google sign-in is enabled. Set these values
in the frontend hosting provider before building the app.
For step-by-step Vercel setup, see
[frontend/VERCEL_DEPLOYMENT.md](frontend/VERCEL_DEPLOYMENT.md).

## Security and credentials

- Never commit `.env`, `.env.local`, database URLs, Cloudinary secrets, Django
  production secret keys, or payment secrets.
- Treat all `NEXT_PUBLIC_*` values as public.
- Use HTTPS for deployed frontend and backend origins.
