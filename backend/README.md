# menuPilot Backend — Sprint 1

Laravel API for the Sprint 1 frontend integration.

## Included

- Owner registration + restaurant creation
- Login with Sanctum bearer token
- Current authenticated user (`/auth/me`)
- Logout / token revocation
- Temporary account lockout after repeated failed login attempts
- Restaurant profile read/update (`/settings`)
- MySQL migrations
- Demo seed account
- Postman collection

## Requirements

- PHP 8.2+
- Composer
- MySQL 8+ (or a compatible MySQL/MariaDB version)
- Node.js is only required for the frontend

## Setup on Windows

From the repository root:

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Create a MySQL database named `menupilot` (or use another name and change `DB_DATABASE` in `.env`). Then run:

```powershell
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

The API will be available at:

`http://127.0.0.1:8000/api`

The frontend should use:

`VITE_API_URL=http://127.0.0.1:8000/api`

## Demo account

Email: `owner@menupilot.app`

Password: `password123`

## Postman

Import:

`backend/postman/menuPilot-Sprint1.postman_collection.json`

Run **Login** first. The collection test script stores the returned bearer token automatically. Then run **Current user**, **Get restaurant profile**, or **Update restaurant profile**.

You can also run **Register owner + restaurant** to create a fresh tenant and token.

## API endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | No | Create restaurant + owner |
| POST | `/auth/login` | No | Login and issue token |
| GET | `/auth/me` | Bearer | Get current user + restaurant |
| POST | `/auth/logout` | Bearer | Revoke current token |
| GET | `/settings` | Bearer | Get current restaurant |
| PUT | `/settings` | Bearer | Update current restaurant |

Validation errors use Laravel's standard JSON shape with HTTP 422. Invalid credentials return 401. A temporarily locked account returns 423.

## Important

Never commit the real `.env` file or production secrets. The repository only contains `.env.example`.
