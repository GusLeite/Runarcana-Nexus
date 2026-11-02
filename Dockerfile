# API Spring Boot (o front tem o próprio Dockerfile em frontend/).
FROM eclipse-temurin:27-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src
RUN sh mvnw -q -DskipTests package

FROM eclipse-temurin:27-jre
RUN useradd --system --no-create-home runarcana
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER runarcana
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
