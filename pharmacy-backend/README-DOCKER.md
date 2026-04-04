# Docker deployment on Render

## Prerequisites

- Render account and Git repository connected.

## Steps

1. **PostgreSQL**  
   In the Render dashboard, create a **PostgreSQL** instance. Note the **Internal Database URL** (or host, database name, user, password).

2. **Web service (Docker)**  
   Create a **Web Service**, choose **Docker**. Set **Root Directory** to `pharmacy-backend` if you configure the service from the monorepo subfolder; if you use the repo-root [render.yaml](../render.yaml) blueprint, paths are already set to `./pharmacy-backend`.

3. **Environment variables** (Web Service)

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `SPRING_PROFILES_ACTIVE` | Yes | `prod` |
   | `SPRING_DATASOURCE_URL` | Yes | JDBC URL, e.g. `jdbc:postgresql://host:5432/dbname` (adjust host/port/db from Render’s Postgres page) |
   | `SPRING_DATASOURCE_USERNAME` | Yes | Database user |
   | `SPRING_DATASOURCE_PASSWORD` | Yes | Database password |
   | `JWT_SECRET` | Yes | Long random secret (hex or base64) |
   | `CORS_ORIGINS` | Yes | Comma-separated frontend origins, e.g. `https://your-app.onrender.com` |
   | `JAVA_OPTS` | Optional | Default in Dockerfile: `-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport` |
   | `APP_STORAGE_UPLOAD_DIR` | Optional | Default in prod: `/data/uploads/pharmacies` (ephemeral unless you attach a disk and mount `/data`) |
   | `JWT_EXPIRATION_MS` | Optional | Defaults from `application.properties` if unset |
   | `PORT` | No | Render sets this automatically |

4. **Health check**  
   This app includes Spring Boot Actuator. Use health check path **`/actuator/health`** (already referenced in [render.yaml](../render.yaml)).

5. **Deploy**  
   Push to your connected branch; Render builds the image from `pharmacy-backend/Dockerfile` and runs the container.

## Local Docker (optional)

From `pharmacy-backend`:

```bash
docker build -t pharmacy-backend .
docker run --rm -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=... -e SPRING_DATASOURCE_USERNAME=... -e SPRING_DATASOURCE_PASSWORD=... \
  -e JWT_SECRET=... -e CORS_ORIGINS=http://localhost:5173 \
  pharmacy-backend
```
