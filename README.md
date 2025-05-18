# 🇨🇱 Chilean Postal Codes API

**Open-source API as a Service** for Chilean postal-code look-ups, powered by headless scraping of the official Correos de Chile site.

> 🛠️ Built with ❤️ by [KaiNext](https://kainext.cl) — cloud solutions that automate processes and scale real-world businesses.

---

## ✨ Why does this API exist?

Correos de Chile only offers a web form for postal-code queries. This project:

- ✅ Automates the official form with **Playwright**
- ✅ Scrapes **only** when the code is missing from the database
- ✅ Caches results in PostgreSQL for instant future queries
- ✅ Exposes clean REST endpoints for **address → postal-code** search and location data
- ✅ Ships an **open-source codebase** + **hosted API** with free and paid tiers

---

## 🌐 Production

> **Base URL:** `https://postal-code-api.kainext.cl/v1`

### 🔓 Public endpoints (no authentication required)

| Method & Path                 | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| `GET /v1/health`              | System health status                                   |
| `GET /v1/stats/summary`       | Record counts for key entities                         |
| `GET /v1/postal-codes/search` | Search postal code by _commune_, _street_ and _number_ |
| `GET /v1/regions`             | List all Chilean regions                               |
| `GET /v1/communes`            | List all Chilean communes                              |

### 🔐 Protected endpoints (password required)

| Method & Path                | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `GET /v1/postal-codes`       | Paginated list of all postal codes                    |
| `GET /v1/postal-codes/:code` | Reverse lookup: addresses for a postal code           |
| `POST /v1/seeders/*`         | Seeders & database-normalization tools (internal use) |

> **Password** must be sent as a `password` query parameter (for **GET**) or in the request body (for **POST** seeders).
> The value is defined in `SEED_PASSWORD` or falls back to a hard-coded default in development.

Interactive Swagger docs live at **`/v1/api`**.

---

## 🔍 Quick example — search a postal code

```
GET /v1/postal-codes/search?commune=LAS+CONDES&street=AVENIDA+APOQUINDO&number=3000
```

```jsonc
{
  "id": "uuid",
  "street": "AVENIDA APOQUINDO",
  "number": "3000",
  "commune": "LAS CONDES",
  "region": "REGIÓN METROPOLITANA",
  "postalCode": "7550174",
}
```

If the code is not cached, the API scrapes Correos de Chile in real time, stores the new record, and returns it in the same response.

---

## 🚀 Local setup

```bash
git clone https://github.com/Alejandrehl/correos-cl-postal-code-api.git
cd correos-cl-postal-code-api

# Environment variables
cp .env.example .env
# → Configure DB, password, etc.

# Install deps
npm install

# Dev mode
npm run start:dev
```

### Useful scripts (local development only)

| Script                  | Purpose                        |
| ----------------------- | ------------------------------ |
| `npm run seed:regions`  | Insert Chilean regions locally |
| `npm run seed:communes` | Insert all communes locally    |
| `npm run build`         | Compile TypeScript             |
| `npm run start:prod`    | Run from `dist/`               |

> In production **seeding and normalization are done via the HTTP endpoints**
> (`POST /v1/seeders/*`) with the secure password.

---

## 🧠 Tech stack

- **NestJS** + **Fastify** — high-performance TypeScript API
- **Playwright** — reliable browser automation for scraping
- **TypeORM** + **PostgreSQL** — relational persistence layer
- **Swagger / OpenAPI** — live documentation at `/v1/api`
- **Railway** — one-click cloud deployment

---

## 🤝 Contributing

1. **Fork** the repo
2. Create a feature branch: `git checkout -b feature/amazing`
3. Commit & push your changes
4. Open a **Pull Request**

Please keep the code clean and well documented. 🙏

---

## ⚖️ License

**MIT** © [KaiNext](https://kainext.cl) — use it, improve it, and share it freely.

---

## ☕ Support

If this project saved you time:

- Give the repo a **⭐**
- Share it on social networks
- Say hi on [LinkedIn](https://www.linkedin.com/in/alejandrehl/)

---

## 📫 Maintainer

- **Alejandro Exequiel Hernández Lara**
- Founder & Software Architect — KaiNext
- ✉️ alejandro@kainext.cl
- 🌐 <https://postal-code-api.kainext.cl>
