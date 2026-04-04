# Deploying on Render (Docker)

`application.properties` already binds the HTTP port with `server.port=${PORT:8080}`, so Render’s `PORT` is used automatically. The Docker `ENTRYPOINT` also passes `-Dserver.port=${PORT:-8080}` for the same behavior.

## Environment variables to set (production)

| Variable | Purpose |
|----------|---------|
| `SPRING_PROFILES_ACTIVE` | Set to `prod` (disables dev seeding; see `application-prod.properties`). |
| `SPRING_DATASOURCE_URL` | JDBC URL, e.g. `jdbc:postgresql://HOST:5432/DBNAME`. |
| `SPRING_DATASOURCE_USERNAME` | Database user. |
| `SPRING_DATASOURCE_PASSWORD` | Database password. |
| `JWT_SECRET` | Strong secret for signing tokens (override the default). |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. your frontend URL). |
| `APP_STORAGE_UPLOAD_DIR` | Writable path for uploads; prod default in config is `/tmp/pharmacy-uploads` if unset. |

Optional: `JWT_EXPIRATION_MS`, `APP_DATA_SEED` (keep `false` or omit in prod).

Render’s managed Postgres often exposes a `postgres://…` URL; convert host, port, database name, user, and password into the JDBC URL and the two datasource variables above.
