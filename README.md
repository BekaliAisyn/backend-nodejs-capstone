# SecondChance — JavaScript Backend Capstone

A donation and reuse platform built with Node.js, Express, MongoDB and the supplied React frontend. The upstream IBM starter is retained under the Apache-2.0 license.

## Run locally

Use Node.js 22 or later and MongoDB 7 or later. Set `MONGO_URL`, `MONGO_DB`, `PORT` and a random `JWT_SECRET` of at least 32 characters using `secondChance-backend/.env.example` as a guide. Do not commit real secrets.

```sh
npm ci --prefix secondChance-backend
npm ci --prefix secondChance-frontend
npm ci --prefix sentiment
npm run seed --prefix secondChance-backend
npm run build --prefix secondChance-frontend
npm start --prefix secondChance-backend
```

Open http://localhost:3060/ for the landing page and http://localhost:3060/app for the React application. Run the optional sentiment microservice with `npm start --prefix sentiment` on port 3000.

## Architecture and API

- `secondChance-backend/models/db.js`: pooled connection with one shared connection promise and unique indexes.
- `routes/authRoutes.js`: registration, bcrypt password hashing, JWT login, and profile updates using the verified token identity.
- `routes/secondChanceItemsRoutes.js`: public list/detail reads, authenticated image upload and creation, owner-only updates/deletions, and atomic comment insertion.
- `routes/searchRoutes.js`: combined category, condition, literal name and maximum-age filters. Query objects are not accepted from clients.
- `sentiment/index.js`: Natural sentiment analysis via `POST /sentiment`.
- `secondChance-frontend`: supplied React application, configured for the same origin and authenticated uploads.

The seed command imports exactly 16 starter records and is idempotent. Public endpoints are `GET /api/secondchance/items`, `GET /api/secondchance/items/:id` and `GET /api/secondchance/search`. Auth endpoints are `POST /api/auth/register`, `POST /api/auth/login` and `PUT /api/auth/update`. Send `Authorization: Bearer <token>` for mutations. Images are limited to 2 MiB with MIME and file-signature validation; generated file names prevent path traversal and collisions.

## Validation and delivery

```sh
npm test --prefix secondChance-backend
npm test --prefix sentiment
npm run build --prefix secondChance-frontend
docker build -t secondchance .
```

The API integration suite uses a separate `secondChance_test` database. It verifies MongoDB import, filtering, authentication, profile identity, image upload, ownership, concurrent comments, deletion and invalid input. Only that disposable test database is cleared. The sentiment suite checks positive, negative and neutral text and invalid requests.

GitHub Actions runs the two test suites against a MongoDB service, builds the React frontend and builds the deployment container. Runtime database credentials and JWT keys are supplied externally; the image contains no deployment secrets. The container runs as the unprivileged `node` user.

User stories and acceptance criteria are tracked in this repository's Issues. The reusable template is `.github/ISSUE_TEMPLATE/user-story.md`.
