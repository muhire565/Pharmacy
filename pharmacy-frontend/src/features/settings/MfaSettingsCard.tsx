import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";

export function MfaSettingsCard() {
  const { t } = useTranslation();
  const [secret, setSecret] = useState<string | null>(null);
  const [otpUri, setOtpUri] = useState<string | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  const setupMut = useMutation({
    mutationFn: authApi.mfaSetup,
    onSuccess: (data) => {
      setSecret(data.secretBase32);
      setOtpUri(data.otpAuthUri);
      toast.success(t("settings.mfaSetupLoaded"));
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const enableMut = useMutation({
    mutationFn: authApi.mfaEnable,
    onSuccess: () => {
      toast.success(t("settings.mfaEnabledToast"));
      setSecret(null);
      setOtpUri(null);
      setEnableCode("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const disableMut = useMutation({
    mutationFn: authApi.mfaDisable,
    onSuccess: () => {
      toast.success(t("settings.mfaDisabledToast"));
      setDisablePassword("");
      setSecret(null);
      setOtpUri(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Card>
      <CardHeader title={t("settings.mfaTitle")} />
      <div className="space-y-4 p-4 pt-0">
        <p className="text-sm text-ink-muted">{t("settings.mfaSubtitle")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setupMut.mutate()}
            loading={setupMut.isPending}
          >
            {t("settings.startSetup")}
          </Button>
        </div>
        {secret ? (
          <div className="space-y-3 rounded-xl border border-ink/10 bg-muted/20 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("settings.secretLabel")}
              </p>
              <p className="mt-1 break-all font-mono text-sm text-ink">{secret}</p>
            </div>
            {otpUri ? (
              <p className="text-xs leading-relaxed text-ink-muted">{t("settings.otpUriHint")}</p>
            ) : null}
            <div className="border-t border-ink/10 pt-3">
              <p
                id="mfa-totp-step-title"
                className="text-xs font-semibold uppercase tracking-wide text-primary"
              >
                {t("auth.mfaCode")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t("settings.mfaCodeHelp")}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  id="mfa-totp-code"
                  name="mfa-totp-code"
                  aria-labelledby="mfa-totp-step-title"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={enableCode}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setEnableCode(d);
                  }}
                  className="max-w-[11rem] font-mono text-lg tracking-[0.2em]"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (enableCode.length !== 6) {
                      toast.error(t("settings.mfaNeedSixDigits"));
                      return;
                    }
                    enableMut.mutate(enableCode);
                  }}
                  loading={enableMut.isPending}
                >
                  {t("settings.enableMfa")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="border-t border-ink/8 pt-4">
          <p className="mb-2 text-xs font-semibold text-ink-muted">{t("settings.disableMfa")}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              label={t("settings.accountPassword")}
              type="password"
              passwordToggle
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => disableMut.mutate(disablePassword)}
              loading={disableMut.isPending}
            >
              {t("settings.disableMfa")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
