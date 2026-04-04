import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LogOut,
  ShieldCheck,
  ShieldX,
  Building2,
  MoreHorizontal,
  Pencil,
  Lock,
  LockOpen,
  Trash2,
} from "lucide-react";
import { ownerApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import type { OwnerPharmacy, OwnerPharmacyUpdateRequest } from "@/api/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, Td, Th } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/authStore";
import { getLiveSocketUrl } from "@/utils/liveSocket";
import { formatLongDateTime, getGreetingForTime } from "@/utils/greeting";
import { useNow } from "@/hooks/useNow";
import { MfaSettingsCard } from "@/features/settings/MfaSettingsCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function OwnerDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<OwnerPharmacy | null>(null);
  const [lockTarget, setLockTarget] = useState<OwnerPharmacy | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [actionOpenId, setActionOpenId] = useState<number | null>(null);
  const now = useNow(1000);
  const greeting = getGreetingForTime(now);
  const dayTime = formatLongDateTime(now);

  const list = useQuery({
    queryKey: ["owner", "pharmacies", page],
    queryFn: () => ownerApi.listPharmacies(page, 20),
    staleTime: 5_000,
  });

  const rows = useMemo(() => {
    const items = list.data?.content ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((p) =>
      [p.name, p.email, p.countryCode, p.phoneE164].some((s) =>
        (s ?? "").toLowerCase().includes(term)
      )
    );
  }, [list.data, q]);

  const summary = useMemo(() => {
    const items = list.data?.content ?? [];
    const locked = items.filter((p) => p.locked).length;
    return {
      total: list.data?.totalElements ?? 0,
      active: Math.max(0, items.length - locked),
      locked,
    };
  }, [list.data]);

  const lockMut = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) =>
      ownerApi.lockPharmacy(id, reason ? { reason } : {}),
    onSuccess: () => {
      toast.success("Pharmacy locked");
      setLockTarget(null);
      setLockReason("");
      void qc.invalidateQueries({ queryKey: ["owner", "pharmacies"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const unlockMut = useMutation({
    mutationFn: (id: number) => ownerApi.unlockPharmacy(id),
    onSuccess: () => {
      toast.success("Pharmacy unlocked");
      void qc.invalidateQueries({ queryKey: ["owner", "pharmacies"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => ownerApi.deletePharmacy(id),
    onSuccess: () => {
      toast.success("Deleted");
      void qc.invalidateQueries({ queryKey: ["owner", "pharmacies"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const saveMut = useMutation({
    mutationFn: async (payload: { id: number; body: OwnerPharmacyUpdateRequest }) =>
      ownerApi.updatePharmacy(payload.id, payload.body),
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["owner", "pharmacies"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  useEffect(() => {
    if (!token) return;
    let ws: WebSocket | null = null;
    let cancelled = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket(getLiveSocketUrl({ scope: "owner", token }));
      ws.onmessage = () => {
        void qc.invalidateQueries({ queryKey: ["owner", "pharmacies"] });
      };
      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimer = window.setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws?.close();
        }
      }
    };
  }, [token, qc]);

  useEffect(() => {
    if (actionOpenId == null) return;
    const onDocClick = () => setActionOpenId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [actionOpenId]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="rounded-2xl border border-ink/10 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent px-4 py-3 shadow-card sm:px-5 sm:py-4">
            <p className="text-sm font-medium uppercase tracking-wide text-ink-muted">
              {greeting}
            </p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight text-ink sm:text-3xl">
              {t("owner.headline")}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{dayTime}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <LanguageSwitcher selectClassName="min-w-[10rem]" />
          <Button
            variant="secondary"
            className="w-full shrink-0 gap-2 sm:w-auto"
            onClick={() => {
              qc.clear();
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="size-4" />
            {t("owner.logout")}
          </Button>
        </div>
      </div>

      <MfaSettingsCard />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{t("owner.totalPharmacies")}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{summary.total}</p>
            </div>
            <Building2 className="size-6 text-primary/70" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{t("owner.activeOnPage")}</p>
              <p className="mt-1 text-2xl font-semibold text-success">{summary.active}</p>
            </div>
            <ShieldCheck className="size-6 text-success" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{t("owner.lockedOnPage")}</p>
              <p className="mt-1 text-2xl font-semibold text-danger">{summary.locked}</p>
            </div>
            <ShieldX className="size-6 text-danger" />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t("owner.pharmacies")}
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                placeholder={t("owner.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 w-full sm:w-72"
              />
              <Button
                variant="secondary"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => void qc.invalidateQueries({ queryKey: ["owner", "pharmacies"] })}
              >
                Refresh
              </Button>
            </div>
          }
        />

        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Country</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Address</Th>
              <Th>Status</Th>
              <Th>Lock reason</Th>
              <Th className="w-28 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <tr>
                <Td colSpan={8} className="text-ink-muted">
                  Loading…
                </Td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <Td colSpan={8} className="text-ink-muted">
                  No pharmacies found.
                </Td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <Td className="font-medium">{p.name}</Td>
                  <Td className="text-ink-muted">{p.countryCode}</Td>
                  <Td className="text-ink-muted">{p.email}</Td>
                  <Td className="font-mono text-sm text-ink-muted">{p.phoneE164}</Td>
                  <Td className="max-w-[220px] truncate text-ink-muted" title={p.address}>
                    {p.address}
                  </Td>
                  <Td>
                    {p.locked ? (
                      <Badge tone="danger">Locked</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </Td>
                  <Td className="max-w-[220px] text-xs text-ink-muted">
                    {p.lockedReason || "—"}
                  </Td>
                  <Td className="text-right">
                    <div className="relative inline-block text-left">
                      <Button
                        variant="secondary"
                        className="size-9 p-0"
                        aria-label={`Open actions for ${p.name}`}
                        onClick={(e) => {
                          // Keep the same click from bubbling to document handler.
                          e.stopPropagation();
                          setActionOpenId((curr) => (curr === p.id ? null : p.id));
                        }}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                      {actionOpenId === p.id ? (
                        <div
                          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-ink/10 bg-surface shadow-soft"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-muted"
                            onClick={() => {
                              setEditing(p);
                              setActionOpenId(null);
                            }}
                          >
                            <Pencil className="size-4" />
                            Edit pharmacy
                          </button>
                          {p.locked ? (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-muted"
                              onClick={() => {
                                unlockMut.mutate(p.id);
                                setActionOpenId(null);
                              }}
                            >
                              <LockOpen className="size-4" />
                              Unlock pharmacy
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-muted"
                              onClick={() => {
                                setLockTarget(p);
                                setLockReason("");
                                setActionOpenId(null);
                              }}
                            >
                              <Lock className="size-4" />
                              Lock pharmacy
                            </button>
                          )}
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
                            onClick={() => {
                              setActionOpenId(null);
                              if (confirm(`Delete ${p.name}? This cannot be undone.`)) {
                                deleteMut.mutate(p.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                            Delete pharmacy
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            Total: {list.data?.totalElements ?? 0}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              disabled={(list.data?.totalPages ?? 1) <= page + 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Lock modal */}
      <Modal
        open={!!lockTarget}
        onClose={() => setLockTarget(null)}
        title={lockTarget ? `Lock ${lockTarget.name}` : "Lock pharmacy"}
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">
            Locked pharmacies cannot sign in. They will see a message instructing them to contact the admin.
          </p>
          <Input
            label="Reason (optional)"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            placeholder="e.g. Billing overdue, policy review…"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setLockTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={lockMut.isPending}
              onClick={() => {
                if (!lockTarget) return;
                lockMut.mutate({ id: lockTarget.id, reason: lockReason.trim() || undefined });
              }}
            >
              Lock pharmacy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : "Edit pharmacy"}
      >
        {editing ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const body: OwnerPharmacyUpdateRequest = {
                name: editing.name,
                countryCode: editing.countryCode,
                phoneE164: editing.phoneE164,
                email: editing.email,
                address: editing.address,
              };
              saveMut.mutate({ id: editing.id, body });
            }}
          >
            <Input
              label="Name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Country code"
                value={editing.countryCode}
                onChange={(e) =>
                  setEditing({ ...editing, countryCode: e.target.value.toUpperCase() })
                }
              />
              <Input
                label="Phone (E.164)"
                value={editing.phoneE164}
                onChange={(e) => setEditing({ ...editing, phoneE164: e.target.value })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={editing.email}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Address</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink outline-none ring-primary/30 focus:ring-2"
                value={editing.address}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saveMut.isPending}>
                Save
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

