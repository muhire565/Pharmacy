import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pharmacyApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const nameRe = /^[a-zA-Z0-9\s]{1,100}$/;

const schema = z.object({
  pharmacyName: z
    .string()
    .min(1)
    .max(100)
    .regex(nameRe, "Letters, numbers, and spaces only"),
  countryCode: z.string().length(2, "Two-letter country code"),
  phone: z.string().min(1, "Required"),
  address: z.string().min(1).max(250),
});

type Form = z.infer<typeof schema>;

export function PharmacyProfileSettings() {
  const qc = useQueryClient();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const setBranding = useAuthStore((s) => s.setBranding);
  const bumpLogo = useAuthStore((s) => s.bumpLogo);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoErr, setLogoErr] = useState<string | null>(null);

  const { data: pharmacy } = useQuery({
    queryKey: tenantKey(pharmacyId, "pharmacy", "me"),
    queryFn: pharmacyApi.me,
    enabled: pharmacyId != null,
  });

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      pharmacyName: "",
      countryCode: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (!pharmacy) return;
    form.reset({
      pharmacyName: pharmacy.name,
      countryCode: pharmacy.countryCode,
      phone: pharmacy.phoneE164,
      address: pharmacy.address,
    });
  }, [pharmacy, form]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const mut = useMutation({
    mutationFn: async (file: File | null) => {
      const v = form.getValues();
      const fd = new FormData();
      fd.append("pharmacyName", v.pharmacyName.trim());
      fd.append("countryCode", v.countryCode.trim().toUpperCase());
      fd.append("phone", v.phone.trim());
      fd.append("email", pharmacy.email);
      fd.append("address", v.address.trim());
      if (file) fd.append("logo", file);
      return pharmacyApi.updateMe(fd);
    },
    onSuccess: (data, file) => {
      setBranding({ pharmacyName: data.name, logoUrl: data.logoUrl ?? null });
      if (file) bumpLogo();
      setLogoFile(null);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
      void qc.invalidateQueries({
        queryKey: tenantKey(useAuthStore.getState().pharmacyId, "pharmacy", "me"),
      });
      toast.success("Pharmacy profile updated");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  function onPickLogo(f: File | null) {
    setLogoErr(null);
    if (!f) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      setLogoErr("Use PNG or JPEG");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setLogoErr("Max 2MB");
      return;
    }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  }

  if (!pharmacy) return null;

  return (
    <Card className="mb-6">
      <CardHeader title="Pharmacy profile" />
      <form
        className="space-y-4 border-t border-ink/10 p-4"
        onSubmit={form.handleSubmit(() => mut.mutate(logoFile))}
      >
        <Input
          label="Pharmacy name"
          error={form.formState.errors.pharmacyName?.message}
          {...form.register("pharmacyName")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Country code (ISO)"
            maxLength={2}
            className="uppercase"
            error={form.formState.errors.countryCode?.message}
            {...form.register("countryCode")}
          />
          <Input
            label="Phone"
            error={form.formState.errors.phone?.message}
            {...form.register("phone")}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-ink-muted">Login email</p>
          <p className="rounded-lg border border-ink/10 bg-muted/40 px-3 py-2 text-sm text-ink">
            {pharmacy.email}
          </p>
          <p className="text-xs text-ink-muted">
            To change the admin login email, contact support or add a dedicated
            flow (JWT is tied to email).
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">Address</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink outline-none ring-primary/30 focus:ring-2"
            {...form.register("address")}
          />
          {form.formState.errors.address ? (
            <p className="text-sm text-danger">
              {form.formState.errors.address.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">
            New logo (optional)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
            onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
          />
          {logoErr ? (
            <p className="text-sm text-danger">{logoErr}</p>
          ) : null}
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Preview"
              className="mt-2 max-h-24 rounded border border-ink/10 object-contain p-2"
            />
          ) : null}
        </div>
        <Button type="submit" loading={mut.isPending}>
          Save profile
        </Button>
      </form>
    </Card>
  );
}
