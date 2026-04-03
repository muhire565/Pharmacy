import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

export function PharmacyLogo({ className }: { className?: string }) {
  const token = useAuthStore((s) => s.token);
  const logoUrl = useAuthStore((s) => s.logoUrl);
  const brandingVersion = useAuthStore((s) => s.brandingVersion);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !logoUrl) {
      setSrc(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    void api
      .get<Blob>("/pharmacies/me/logo", { responseType: "blob" })
      .then((r) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(r.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, logoUrl, brandingVersion]);

  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={cn("rounded-md object-contain", className)}
    />
  );
}
