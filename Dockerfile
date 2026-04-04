# Root Dockerfile for Render when "Dockerfile Path" is left as default ./Dockerfile
# Build context must be the repository root (not pharmacy-backend).
#
# If you prefer a smaller context instead, set in Render:
#   Dockerfile Path: pharmacy-backend/Dockerfile
#   Docker Build Context: pharmacy-backend

FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pharmacy-backend/pom.xml .
RUN mvn -B -q dependency:go-offline -DskipTests || true

COPY pharmacy-backend/src ./src
RUN mvn -B -q package -DskipTests
RUN mv /app/target/pharmacy-backend-*.jar /app/target/app.jar

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app

COPY --from=build /app/target/app.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

# Render injects PORT; bind on all interfaces for the platform proxy.
ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS:-} -jar /app/app.jar --server.address=0.0.0.0 --server.port=${PORT}"]
