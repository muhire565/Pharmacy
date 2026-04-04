import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client";
import { authApi } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().min(1).email(),
});

type Form = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const m = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email.trim().toLowerCase()),
    onSuccess: () => {
      toast.success(t("auth.resetSent"));
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md border-ink/10 p-8 shadow-card">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            {t("auth.backToSignIn")}
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-ink">{t("auth.forgotTitle")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("auth.forgotSubtitle")}</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit((v) => m.mutate(v.email))} noValidate>
          <Input
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" className="w-full" loading={m.isPending}>
            {t("auth.sendResetLink")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
