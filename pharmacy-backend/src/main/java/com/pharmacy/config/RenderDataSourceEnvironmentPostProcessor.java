package com.pharmacy.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Normalizes database URLs from hosts like Render where {@code SPRING_DATASOURCE_URL} is sometimes
 * missing the {@code jdbc:postgresql:} prefix (e.g. starts with {@code //host:5432/db}) or is given
 * as {@code postgres://user:pass@host/db}.
 */
public class RenderDataSourceEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String SOURCE_NAME = "renderDatasourceUrlNormalizer";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String raw = environment.getProperty("SPRING_DATASOURCE_URL");
        if (raw == null || raw.isBlank()) {
            return;
        }
        raw = raw.trim();
        if (raw.startsWith("jdbc:postgresql:")) {
            return;
        }

        Map<String, Object> overrides = new HashMap<>();

        if (raw.startsWith("//")) {
            overrides.put("spring.datasource.url", "jdbc:postgresql:" + raw);
            addOverrides(environment, overrides);
            return;
        }

        if (raw.startsWith("postgres://") || raw.startsWith("postgresql://")) {
            Parsed parsed = parsePostgresUri(raw);
            if (parsed != null) {
                overrides.put("spring.datasource.url", parsed.jdbcUrl);
                if (parsed.username != null && isUnset(environment, "SPRING_DATASOURCE_USERNAME")) {
                    overrides.put("spring.datasource.username", parsed.username);
                }
                if (parsed.password != null && isUnset(environment, "SPRING_DATASOURCE_PASSWORD")) {
                    overrides.put("spring.datasource.password", parsed.password);
                }
                addOverrides(environment, overrides);
            }
        }
    }

    private static boolean isUnset(ConfigurableEnvironment environment, String key) {
        String v = environment.getProperty(key);
        return v == null || v.isBlank();
    }

    private static void addOverrides(ConfigurableEnvironment environment, Map<String, Object> overrides) {
        if (overrides.isEmpty()) {
            return;
        }
        environment.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, overrides));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private static final class Parsed {
        final String jdbcUrl;
        final String username;
        final String password;

        Parsed(String jdbcUrl, String username, String password) {
            this.jdbcUrl = jdbcUrl;
            this.username = username;
            this.password = password;
        }
    }

    private static Parsed parsePostgresUri(String url) {
        try {
            URI uri = URI.create(url.replaceFirst("^postgres(ql)?://", "http://"));
            String host = uri.getHost();
            if (host == null) {
                return null;
            }
            int port = uri.getPort();
            String portSegment = port > 0 ? ":" + port : ":5432";

            String path = uri.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) {
                return null;
            }
            String db = path.startsWith("/") ? path.substring(1) : path;
            int q = db.indexOf('?');
            if (q >= 0) {
                db = db.substring(0, q);
            }
            if (db.isBlank()) {
                return null;
            }

            String jdbcUrl = "jdbc:postgresql://" + host + portSegment + "/" + db;

            String user = null;
            String pass = null;
            String userInfo = uri.getRawUserInfo();
            if (userInfo != null && !userInfo.isEmpty()) {
                int colon = userInfo.indexOf(':');
                if (colon >= 0) {
                    user = URLDecoder.decode(userInfo.substring(0, colon), StandardCharsets.UTF_8);
                    pass = URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8);
                } else {
                    user = URLDecoder.decode(userInfo, StandardCharsets.UTF_8);
                }
            }

            return new Parsed(jdbcUrl, user, pass);
        } catch (Exception ignored) {
            return null;
        }
    }
}
