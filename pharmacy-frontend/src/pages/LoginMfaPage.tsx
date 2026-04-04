import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, " "),
});

type Form = z.infer<typeof schema>;

type LocState = { mfaChallengeToken?: string; email?: string | null };

export function LoginMfaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const state = loc.state as LocState | null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const m = useMutation({
    mutationFn: (code: string) =>
      authApi.verifyMfa({ mfaChallengeToken: state!.mfaChallengeToken!, code: code.trim() }),
    onSuccess: (data) => {
      qc.clear();
      useCartStore.getState().clear();
      setAuth(data);
      toast.success(t("auth.signedIn"));
      if (data.role === "SYSTEM_OWNER") {
        navigate("/owner", { replace: true });
        return;
      }
      navigate("/app", { replace: true });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t("auth.loginFailed"))),
  });

  if (!state?.mfaChallengeToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md border-ink/10 p-8 shadow-card">
        <div className="mb-6">
          <Link
            to="/login"
            state={null}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            {t("auth.mfaBack")}
          </Link>
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-ink">{t("auth.mfaTitle")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("auth.mfaSubtitle")}</p>
          {state.email ? (
            <p className="mt-2 text-xs font-mono text-ink-muted">{state.email}</p>
          ) : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit((v) => m.mutate(v.code))} noValidate>
          <Input
            label={t("auth.mfaCode")}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="font-mono tracking-widest"
            error={errors.code?.message}
            {...register("code")}
          />
          <Button type="submit" className="w-full" loading={m.isPending}>
            {t("auth.verifyAndSignIn")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
