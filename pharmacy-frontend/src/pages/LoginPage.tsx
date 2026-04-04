import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client";
import { authApi } from "@/api/queries";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Required").email("Enter a valid email"),
  password: z.string().min(1, "Required"),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loc = useLocation();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const from = (loc.state as { from?: string } | null)?.from ?? "/app";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const m = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.mfaRequired && data.mfaChallengeToken) {
        navigate("/login/mfa", {
          replace: true,
          state: { mfaChallengeToken: data.mfaChallengeToken, email: data.email },
        });
        return;
      }
      if (!data.token) {
        toast.error(t("auth.loginFailed"));
        return;
      }
      queryClient.clear();
      useCartStore.getState().clear();
      setAuth(data);
      toast.success(t("auth.signedIn"));
      if (data.role === "SYSTEM_OWNER") {
        navigate("/owner", { replace: true });
        return;
      }
      navigate(from.startsWith("/app") ? from : "/app", { replace: true });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t("auth.loginFailed"))),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted px-4 py-8">
      <div className="absolute right-4 top-4 w-40">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md border-ink/10 p-8 shadow-card">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            {t("landing.backHome")}
          </Link>
        </div>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            Rx
          </div>
          <h1 className="text-xl font-semibold text-ink">{t("auth.signInTitle")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("auth.signInSubtitle")}</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((v) => m.mutate(v))}
          noValidate
        >
          <Input
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label={t("auth.password")}
            type="password"
            passwordToggle
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <Button type="submit" className="w-full" loading={m.isPending}>
            {t("auth.continue")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          {t("auth.newPharmacy")}{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            {t("auth.createAccount")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
