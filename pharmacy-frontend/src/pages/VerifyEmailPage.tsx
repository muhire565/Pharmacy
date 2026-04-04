import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "@/api/client";
import { authApi } from "@/api/queries";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const q = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => authApi.verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md border-ink/10 p-8 text-center shadow-card">
          <p className="text-sm text-ink-muted">{t("auth.verifyFailed")}</p>
          <Link to="/login" className="mt-4 inline-block text-primary hover:underline">
            {t("auth.backToSignIn")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md border-ink/10 p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold text-ink">{t("auth.verifyEmailTitle")}</h1>
        {q.isPending ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-sm text-ink-muted">{t("auth.verifyEmailSubtitle")}</p>
          </div>
        ) : q.isError ? (
          <p className="mt-4 text-sm text-danger">{getApiErrorMessage(q.error, t("auth.verifyFailed"))}</p>
        ) : q.isSuccess ? (
          <p className="mt-4 text-sm text-success">{t("auth.verifySuccess")}</p>
        ) : null}
        <Link to="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          {t("auth.backToSignIn")}
        </Link>
      </Card>
    </div>
  );
}
