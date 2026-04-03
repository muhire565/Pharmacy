export function getLiveSocketUrl(query: Record<string, string | number>) {
  const wsBase = import.meta.env.VITE_WS_URL?.trim();
  const api = import.meta.env.VITE_API_URL?.trim();
  const entries = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  if (wsBase && /^https?:\/\//i.test(wsBase)) {
    const u = new URL(wsBase);
    const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${u.host}/ws/live?${entries}`;
  }

  if (api && /^https?:\/\//i.test(api)) {
    const u = new URL(api);
    const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${u.host}/ws/live?${entries}`;
  }

  // In Vite dev with relative API URL, connect directly to backend
  if (import.meta.env.DEV) {
    return `ws://localhost:8080/ws/live?${entries}`;
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.host}/ws/live?${entries}`;
}

