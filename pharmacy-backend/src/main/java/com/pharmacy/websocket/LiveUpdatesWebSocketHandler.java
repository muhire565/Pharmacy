package com.pharmacy.websocket;

import com.pharmacy.security.JwtTokenProvider;
import com.pharmacy.security.PharmacyUserDetails;
import com.pharmacy.entity.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class LiveUpdatesWebSocketHandler extends TextWebSocketHandler {

    private static final String ATTR_TENANT = "tenantId";
    private static final String OWNER_SCOPE = "owner";
    private final Map<Long, Set<WebSocketSession>> tenantSessions = new ConcurrentHashMap<>();
    private final Set<WebSocketSession> ownerSessions = ConcurrentHashMap.newKeySet();
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        ConnectionParams params = extractParams(session.getUri());
        if (params == null || !jwtTokenProvider.validate(params.token())) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }
        Authentication authentication = jwtTokenProvider.toAuthentication(params.token());
        PharmacyUserDetails principal = (PharmacyUserDetails) authentication.getPrincipal();
        if (OWNER_SCOPE.equalsIgnoreCase(params.scope())) {
            if (principal.getRole() != Role.SYSTEM_OWNER) {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Only owner can use owner scope"));
                return;
            }
            session.getAttributes().put(ATTR_TENANT, OWNER_SCOPE);
            ownerSessions.add(session);
        } else {
            Long tenantId = principal.getPharmacyId();
            if (tenantId == null || !tenantId.equals(params.tenantId())) {
                session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Tenant mismatch"));
                return;
            }
            session.getAttributes().put(ATTR_TENANT, tenantId);
            tenantSessions.computeIfAbsent(tenantId, k -> ConcurrentHashMap.newKeySet()).add(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object v = session.getAttributes().get(ATTR_TENANT);
        if (OWNER_SCOPE.equals(v)) {
            ownerSessions.remove(session);
            return;
        }
        if (!(v instanceof Long tenantId)) {
            return;
        }
        Set<WebSocketSession> set = tenantSessions.get(tenantId);
        if (set != null) {
            set.remove(session);
            if (set.isEmpty()) {
                tenantSessions.remove(tenantId);
            }
        }
    }

    public void publishToTenant(Long tenantId, String payload) {
        Set<WebSocketSession> sessions = tenantSessions.get(tenantId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }
        TextMessage msg = new TextMessage(payload);
        sessions.removeIf(s -> !s.isOpen());
        for (WebSocketSession s : sessions) {
            try {
                s.sendMessage(msg);
            } catch (IOException e) {
                log.warn("WebSocket send failed: {}", e.getMessage());
            }
        }
    }

    public void publishToOwners(String payload) {
        if (ownerSessions.isEmpty()) {
            return;
        }
        TextMessage msg = new TextMessage(payload);
        ownerSessions.removeIf(s -> !s.isOpen());
        for (WebSocketSession s : ownerSessions) {
            try {
                s.sendMessage(msg);
            } catch (IOException e) {
                log.warn("WebSocket owner send failed: {}", e.getMessage());
            }
        }
    }

    private ConnectionParams extractParams(URI uri) {
        if (uri == null || uri.getQuery() == null) {
            return null;
        }
        Long tenantId = null;
        String token = null;
        String scope = null;
        String[] pairs = uri.getQuery().split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=", 2);
            if (kv.length != 2) {
                continue;
            }
            if ("tenantId".equals(kv[0])) {
                try {
                    tenantId = Long.valueOf(kv[1]);
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
            if ("token".equals(kv[0])) {
                token = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
            }
            if ("scope".equals(kv[0])) {
                scope = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
            }
        }
        if (tenantId == null || token == null || token.isBlank()) {
            if (OWNER_SCOPE.equalsIgnoreCase(scope) && token != null && !token.isBlank()) {
                return new ConnectionParams(null, token, OWNER_SCOPE);
            }
            return null;
        }
        return new ConnectionParams(tenantId, token, scope);
    }

    private record ConnectionParams(Long tenantId, String token, String scope) {}
}

