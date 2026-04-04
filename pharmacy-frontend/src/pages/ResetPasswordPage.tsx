import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client";
import { authApi } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8)
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, " "),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: " ",
  });

type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const m = useMutation({
    mutationFn: (newPassword: string) => authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success(t("auth.resetSuccess"));
      navigate("/login", { replace: true });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md border-ink/10 p-8 text-center shadow-card">
          <p className="text-sm text-ink-muted">{t("auth.verifyFailed")}</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-primary hover:underline">
            {t("auth.forgotTitle")}
          </Link>
        </Card>
      </div>
    );
  }

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
        <h1 className="text-xl font-semibold text-ink">{t("auth.resetTitle")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("auth.resetSubtitle")}</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit((v) => m.mutate(v.newPassword))} noValidate>
          <Input
            label={t("auth.newPassword")}
            type="password"
            passwordToggle
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Input
            label={t("auth.confirmNewPassword")}
            type="password"
            passwordToggle
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" className="w-full" loading={m.isPending}>
            {t("auth.resetPassword")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
