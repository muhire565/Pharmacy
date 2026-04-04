import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuthStore } from "@/store/authStore";
import { pharmacyApi } from "@/api/queries";
import { getLiveSocketUrl } from "@/utils/liveSocket";
import { tenantKey } from "@/utils/tenantQuery";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AppShell() {
  const token = useAuthStore((s) => s.token);
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const setBranding = useAuthStore((s) => s.setBranding);
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileNavExpanded, setMobileNavExpanded] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileNavExpanded(false);
  }, [isDesktop]);

  const { data: profile } = useQuery({
    queryKey: tenantKey(pharmacyId, "pharmacy", "me"),
    queryFn: pharmacyApi.me,
    enabled: !!token && pharmacyId != null,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!profile) return;
    const s = useAuthStore.getState();
    const nextLogo = profile.logoUrl ?? null;
    if (s.pharmacyName !== profile.name || s.logoUrl !== nextLogo) {
      setBranding({ pharmacyName: profile.name, logoUrl: nextLogo });
    }
  }, [profile, setBranding]);

  useEffect(() => {
    if (!token || !pharmacyId) return;
    let ws: WebSocket | null = null;
    let cancelled = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket(getLiveSocketUrl({ tenantId: pharmacyId, token }));

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string; reason?: string };
          if (data.type === "SALE_CREATED") {
            toast.success("Live update: new sale posted");
          }
          if (data.type === "PHARMACY_LOCKED") {
            toast.error(data.reason || "Your pharmacy has been locked");
            useAuthStore.getState().logout();
            window.location.assign("/login");
            return;
          }
          if (data.type === "POS_DRAFT_UPDATED") {
            void queryClient.invalidateQueries({
              queryKey: tenantKey(pharmacyId, "pos", "draft"),
            });
            return;
          }
        } catch {
          // ignore malformed event payloads
        }
        void queryClient.invalidateQueries();
      };

      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimer = window.setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws?.close();
        }
      }
    };
  }, [token, pharmacyId, queryClient]);

  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar
        mobileExpanded={mobileNavExpanded}
        setMobileExpanded={setMobileNavExpanded}
        isDesktop={isDesktop}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          isDesktop={isDesktop}
          onMenuClick={() => setMobileNavExpanded((v) => !v)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
