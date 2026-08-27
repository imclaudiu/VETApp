FROM maven:3.9 AS build

COPY ./pom.xml /demo/pom.xml

WORKDIR /demo

COPY ./src /demo/src

RUN mvn clean install -DskipTests


FROM eclipse-temurin:21-jre

WORKDIR /demo

COPY --from=build /demo/target/chatbot-0.0.1-SNAPSHOT.jar /demo/demo.jar

EXPOSE 8080

CMD ["java", "-jar", "demo.jar"]