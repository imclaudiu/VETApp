package com.vetapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder()
                .requestInterceptor((request, body, execution) -> {
                    ServletRequestAttributes attrs =
                            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                    if (attrs != null) {
                        String authHeader = attrs.getRequest().getHeader("Authorization");
                        if (authHeader != null) {
                            request.getHeaders().set("Authorization", authHeader);
                        }
                    }
                    return execution.execute(request, body);
                });
    }
}
