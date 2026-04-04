import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import "@/i18n";
import "./index.css";
import { applyTheme, getInitialTheme } from "@/utils/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Apply theme before first render (prevents “stuck” theme and flash).
applyTheme(getInitialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast: "font-sans border border-ink/10 shadow-card",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
