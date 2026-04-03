import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function OwnerRoute({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  if (role !== "SYSTEM_OWNER") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

