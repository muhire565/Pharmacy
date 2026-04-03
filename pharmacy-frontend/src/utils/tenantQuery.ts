/**
 * Prefix React Query keys with the current pharmacy so cached tenant data is never
 * reused after sign-out / sign-in as another user (or stale within staleTime).
 */
export function tenantKey(
  pharmacyId: number | null | undefined,
  ...segments: readonly unknown[]
) {
  return ["tenant", pharmacyId ?? "none", ...segments] as const;
}
