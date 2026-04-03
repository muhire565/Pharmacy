import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/api/client";
import { publicApi } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  ChevronDown,
  ImageIcon,
  Search,
  Building2,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { LogoUploadModal } from "@/components/register/LogoUploadModal";

const nameRe = /^[a-zA-Z0-9\s]{1,100}$/;

const schema = z.object({
  pharmacyName: z
    .string()
    .min(1, "Required")
    .max(100)
    .regex(
      nameRe,
      "Use letters, numbers, and spaces only (max 100 characters)"
    ),
  countryCode: z.string().length(2, "Select a country"),
  phone: z.string().min(1, "Required"),
  email: z.string().min(1, "Required").email("Invalid email"),
  address: z.string().min(1, "Required").max(250, "Max 250 characters"),
  adminPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Include at least one letter and one number"
    ),
  confirmPassword: z.string().min(8, "Confirm your password"),
}).refine((v) => v.adminPassword === v.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoErr, setLogoErr] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: publicApi.countries,
    staleTime: 86_400_000,
  });

  const filtered = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [countries, countrySearch]);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      pharmacyName: "",
      countryCode: "",
      phone: "",
      email: "",
      address: "",
      adminPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const countryCode = form.watch("countryCode");
  const adminPassword = form.watch("adminPassword");
  const selected = countries.find((c) => c.code === countryCode);
  const passwordChecks = {
    hasMinLength: adminPassword.length >= 8,
    hasLetter: /[A-Za-z]/.test(adminPassword),
    hasNumber: /\d/.test(adminPassword),
  };
  const passwordScore =
    Number(passwordChecks.hasMinLength) +
    Number(passwordChecks.hasLetter) +
    Number(passwordChecks.hasNumber);

  const reg = useMutation({
    mutationFn: async (v: Form) => {
      if (!logoFile) {
        throw new Error("Logo is required");
      }
      const fd = new FormData();
      fd.append("pharmacyName", v.pharmacyName.trim());
      fd.append("countryCode", v.countryCode);
      fd.append("phone", v.phone.trim());
      fd.append("email", v.email.trim().toLowerCase());
      fd.append("address", v.address.trim());
      fd.append("adminPassword", v.adminPassword);
      fd.append("logo", logoFile);
      return publicApi.registerPharmacy(fd);
    },
    onSuccess: (data) => {
      toast.success("Pharmacy registered — sign in with your email");
      if (data.defaultCashierEmail && data.defaultCashierPassword) {
        toast.info(
          `Default cashier: ${data.defaultCashierEmail} / ${data.defaultCashierPassword}`
        );
      }
      navigate("/login", { replace: true });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Registration failed")),
  });

  const steps = [
    {
      title: "Pharmacy details",
      icon: Building2,
      fields: ["pharmacyName", "countryCode", "phone"] as const,
    },
    {
      title: "Contact & branding",
      icon: Phone,
      fields: ["email", "address"] as const,
    },
    {
      title: "Security",
      icon: ShieldCheck,
      fields: ["adminPassword", "confirmPassword"] as const,
    },
  ];

  async function goNextStep() {
    const current = steps[step];
    const ok = await form.trigger(current.fields);
    if (!ok) {
      toast.error("Please fix validation errors before continuing");
      return;
    }
    if (step === 1 && !logoFile) {
      setLogoErr("Logo is required");
      toast.error("Please upload your pharmacy logo");
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  }

  function goPrevStep() {
    setStep((s) => Math.max(0, s - 1));
  }

  function onPickLogo(f: File | null) {
    setLogoErr(null);
    if (!f) {
      setLogoFile(null);
      setLogoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      setLogoErr("Use PNG or JPEG");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setLogoErr("Max file size 2MB");
      return;
    }
    setLogoFile(f);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <Card className="mx-auto w-full max-w-lg border-ink/10 p-6 shadow-card sm:p-8">
        <div className="mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back home
          </Link>
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            Rx
          </div>
          <h1 className="text-xl font-semibold text-ink">Register your pharmacy</h1>
          <p className="mt-1 text-sm text-ink-muted">
            One account per pharmacy — data stays isolated
          </p>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const active = idx === step;
              const done = idx < step;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => {
                    if (idx <= step) setStep(idx);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition",
                    active
                      ? "border-primary/40 bg-primary/10"
                      : done
                      ? "border-success/30 bg-success/10"
                      : "border-ink/10 bg-surface"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Icon className={cn("size-4", active ? "text-primary" : "text-ink-muted")} />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Step {idx + 1}
                    </span>
                  </div>
                  <p className={cn("text-sm font-medium", active ? "text-ink" : "text-ink-muted")}>
                    {s.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (v) => {
            const valid = await form.trigger();
            if (!valid) {
              toast.error("Please complete all required fields");
              return;
            }
            if (!logoFile) {
              setLogoErr("Logo is required");
              toast.error("Logo is required");
              return;
            }
            reg.mutate(v);
          })}
          noValidate
        >
          {step === 0 ? (
            <>
              <Input
                label="Pharmacy name"
                error={form.formState.errors.pharmacyName?.message}
                {...form.register("pharmacyName")}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Country</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCountryOpen((o) => !o)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border border-ink/15 bg-surface px-3 py-2 text-left text-sm",
                      !countryCode && "text-ink-muted"
                    )}
                  >
                    <span>
                      {selected
                        ? `${selected.name} (${selected.dialCode})`
                        : "Select country"}
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-60" />
                  </button>
                  {countryOpen ? (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-ink/15 bg-surface shadow-lg">
                      <div className="flex items-center gap-2 border-b border-ink/10 px-2 py-1.5">
                        <Search className="size-4 text-ink-muted" />
                        <input
                          className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
                          placeholder="Search countries…"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-52 overflow-y-auto py-1 text-sm">
                        {countriesLoading ? (
                          <li className="px-3 py-2 text-ink-muted">Loading…</li>
                        ) : filtered.length === 0 ? (
                          <li className="px-3 py-2 text-ink-muted">No match</li>
                        ) : (
                          filtered.map((c) => (
                            <li key={c.code}>
                              <button
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-muted"
                                onClick={() => {
                                  form.setValue("countryCode", c.code, {
                                    shouldValidate: true,
                                  });
                                  form.setValue("phone", `${c.dialCode} `);
                                  setCountryOpen(false);
                                  setCountrySearch("");
                                }}
                              >
                                {c.name}{" "}
                                <span className="text-ink-muted">{c.dialCode}</span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
                {form.formState.errors.countryCode ? (
                  <p className="text-sm text-danger">
                    {form.formState.errors.countryCode.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <Input
                  label="Phone number"
                  error={form.formState.errors.phone?.message}
                  {...form.register("phone")}
                />
                <p className="text-xs text-ink-muted">
                  Dial code is added when you select a country — complete the rest of the number.
                </p>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                error={form.formState.errors.email?.message}
                {...form.register("email")}
              />

              <div className="space-y-2">
                <span className="text-sm font-medium text-ink">Pharmacy logo</span>
                <button
                  type="button"
                  onClick={() => setLogoModalOpen(true)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border border-ink/15 bg-surface p-4 text-left transition",
                    "hover:border-blue-400/50 hover:bg-blue-50/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  )}
                >
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt=""
                        className="size-14 shrink-0 rounded-lg border border-ink/10 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">Logo ready</p>
                        <p className="truncate text-sm text-ink-muted">
                          {logoFile?.name ?? "Image selected"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-blue-600">
                        Change
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-50/50 text-blue-600/90">
                        <ImageIcon className="size-7 stroke-[1.25]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">Upload pharmacy logo</p>
                        <p className="text-sm text-ink-muted">
                          PNG or JPEG · max 2MB · opens upload dialog
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-blue-600">
                        Browse
                      </span>
                    </>
                  )}
                </button>
                {logoErr ? (
                  <p className="text-sm text-danger">{logoErr}</p>
                ) : null}
              </div>

              <LogoUploadModal
                open={logoModalOpen}
                onClose={() => setLogoModalOpen(false)}
                initialFile={logoFile}
                onConfirm={(file) => {
                  onPickLogo(file);
                  setLogoErr(null);
                }}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Address</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink outline-none ring-primary/30 focus:ring-2"
                  placeholder="Street, city…"
                  {...form.register("address")}
                />
                {form.formState.errors.address ? (
                  <p className="text-sm text-danger">
                    {form.formState.errors.address.message}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Input
                label="Admin password"
                type="password"
                autoComplete="new-password"
                error={form.formState.errors.adminPassword?.message}
                {...form.register("adminPassword")}
              />
              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                error={form.formState.errors.confirmPassword?.message}
                {...form.register("confirmPassword")}
              />
              <div className="rounded-xl border border-ink/10 bg-muted/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Password strength
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className={cn(
                      "h-full transition-all",
                      passwordScore <= 1 && "bg-danger",
                      passwordScore === 2 && "bg-warning",
                      passwordScore === 3 && "bg-success"
                    )}
                    style={{ width: `${(passwordScore / 3) * 100}%` }}
                  />
                </div>
                <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                  <li className={cn(passwordChecks.hasMinLength && "text-success")}>
                    At least 8 characters
                  </li>
                  <li className={cn(passwordChecks.hasLetter && "text-success")}>
                    Includes a letter
                  </li>
                  <li className={cn(passwordChecks.hasNumber && "text-success")}>
                    Includes a number
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-ink">
                <p className="font-medium">Review before creating account</p>
                <p className="mt-1 text-ink-muted">
                  You are creating a dedicated tenant workspace for{" "}
                  <strong>{form.getValues("pharmacyName") || "this pharmacy"}</strong>.
                </p>
              </div>
            </>
          ) : null}
          <div className="flex items-center gap-2 pt-2">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={goPrevStep}>
                Back
              </Button>
            ) : null}
            {step < steps.length - 1 ? (
              <Button type="button" className="ml-auto" onClick={() => void goNextStep()}>
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                className="ml-auto"
                loading={reg.isPending}
                disabled={reg.isPending}
              >
                Create pharmacy
              </Button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
