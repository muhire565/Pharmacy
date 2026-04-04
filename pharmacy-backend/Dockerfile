# Multi-stage build — Java 17 (matches pom.xml).
# Use with Render: Dockerfile Path = pharmacy-backend/Dockerfile, Context = pharmacy-backend

FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline -DskipTests || true
COPY src ./src
RUN mvn -B -q package -DskipTests
RUN mv /app/target/pharmacy-backend-*.jar /app/target/app.jar

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /app/target/app.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "export SERVER_PORT=$PORT; exec java -XX:TieredStopAtLevel=1 ${JAVA_OPTS:-} -jar /app/app.jar --server.address=0.0.0.0 --server.port=$PORT"]
