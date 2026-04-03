import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  if (role !== "PHARMACY_ADMIN") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
