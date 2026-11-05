# CampusDeals Backend (Django)

This backend is built to match the existing Next.js frontend API calls.

## Local development

1. Create venv + install deps

- Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

1. Run migrations + create admin

```powershell
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

1. Start server

```powershell
$env:DJANGO_DEBUG = "1"
python manage.py runserver 8000
```

Uploaded images under `backend/media/` are served by Django when using local
file storage, including when `DJANGO_DEBUG=0`. The frontend dev proxy expects
the backend at `http://127.0.0.1:8000`.

## Environment variables (DigitalOcean App Platform)

- `DJANGO_SECRET_KEY` (required)
- `DJANGO_DEBUG` (`0`/`1`)
- `DJANGO_ALLOWED_HOSTS` (comma-separated, e.g. `your-app.ondigitalocean.app`)
- `DJANGO_CSRF_TRUSTED_ORIGINS` (comma-separated, e.g. `https://your-app.ondigitalocean.app`)
- `DATABASE_URL` (DigitalOcean provides this for managed Postgres)
- `CORS_ALLOWED_ORIGINS` (comma-separated, e.g. `https://your-frontend-domain`)
- `PAYSTACK_SECRET_KEY` (required for payments initialize)
- `PAYSTACK_CALLBACK_URL` (optional)

### Media storage (local vs S3-compatible)

By default, uploads are stored locally under `MEDIA_ROOT` (good for local dev).
The app serves these files directly, but local files are not durable on hosted
platforms with ephemeral filesystems. Configure S3-compatible storage for
production so images remain available across deploys and restarts.

For DigitalOcean App Platform, use S3-compatible storage (DigitalOcean Spaces) by setting:

- `USE_S3=1`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_S3_REGION_NAME`
- `AWS_S3_ENDPOINT_URL` (e.g. `https://nyc3.digitaloceanspaces.com`)
- `AWS_MEDIA_URL` (optional override; otherwise derived from endpoint/bucket)

## App Platform run command

This repo includes a `Procfile`:

```text
web: gunicorn campusdeals_api.wsgi:application --log-file -
```

For App Platform, set:

- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- Run command: `gunicorn campusdeals_api.wsgi:application --log-file -`

## Render deployment

This backend is compatible with Render using Gunicorn.

- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- Start command: `gunicorn campusdeals_api.wsgi:application --bind 0.0.0.0:$PORT --log-file -`

This repo also includes `render.yaml` (Blueprint) so you can deploy by connecting the repo in Render.

Render environment variables to set (recommended):

- `DJANGO_SECRET_KEY` (Render can generate)
- `DJANGO_DEBUG=0`
- `DJANGO_ALLOWED_HOSTS` (e.g. `your-service.onrender.com`)
- `DJANGO_CSRF_TRUSTED_ORIGINS` (e.g. `https://your-service.onrender.com`)
- `DATABASE_URL` (use a Render Postgres instance)
- `CORS_ALLOWED_ORIGINS` (your frontend URL)

## API endpoints implemented (matching frontend)

- Auth
  - `POST /api/auth/register/`
  - `POST /api/auth/login/`
  - `POST /api/auth/refresh/`
  - `GET /api/auth/me/`
  - `PUT /api/auth/profile/` (multipart)
  - `POST /api/auth/password/change/`
  - `GET /api/auth/users/` (admin)
  - `POST /api/auth/users/` (admin)
  - `PATCH /api/auth/users/<id>/` (admin)
  - `DELETE /api/auth/users/<id>/` (admin)
  - `GET /api/auth/analytics/summary/` (admin)

- Store
  - `GET /api/categories/`
  - `GET /api/store/categories/`
  - `GET /api/store/products/`
  - `POST /api/store/products/` (admin)
  - `GET /api/store/products/<slug>/`
  - `PATCH /api/store/products/<slug>/` (admin)
  - `DELETE /api/store/products/<slug>/` (admin)
  - `GET /api/store/favorites/`
  - `POST /api/store/favorites/`
  - `DELETE /api/store/favorites/<product_id>/`

- Categories admin
  - `GET /api/admin/categories/`
  - `POST /api/admin/categories/`
  - `PATCH /api/admin/categories/<id>/`
  - `DELETE /api/admin/categories/<id>/`
  - `PATCH /api/admin/categories/<id>/status/`

- Auctions
  - `GET /api/auctions/`
  - `GET /api/auctions/<id>/`
  - `POST /api/auctions/<id>/bid/`

- Services
  - `GET /api/services/`
  - `GET/POST /api/services/bookings/`
  - `DELETE /api/services/bookings/<id>/`
  - `GET/POST /api/services/admin/services/` (admin)
  - `PATCH/DELETE /api/services/admin/services/<id>/` (admin)
  - `PATCH /api/services/admin/services/<id>/status/` (admin)

- Payments
  - `GET/POST /api/payments/orders/`
  - `GET/DELETE /api/payments/orders/<id>/`
  - `POST /api/payments/initialize/`
