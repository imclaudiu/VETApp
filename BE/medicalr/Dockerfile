# Etapa 1: compilarea proiectului
FROM maven:3.9 AS build

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV CATALINA_OPTS="-Duser.timezone=UTC"

COPY ./pom.xml /demo/pom.xml
WORKDIR /demo
COPY ./src/ /demo/src
WORKDIR /demo
RUN mvn clean install -DskipTests


FROM eclipse-temurin:21-jre

WORKDIR /demo
COPY --from=build /demo/target/medicalr-0.0.1-SNAPSHOT.jar /demo/demo.jar
EXPOSE 8080
CMD ["java", "-jar", "demo.jar"]