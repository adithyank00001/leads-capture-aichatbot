"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FounderDashboardData, FounderProduct } from "@/lib/founder/data";

type FounderDashboardProps = {
  data: FounderDashboardData;
};

export function FounderDashboard({ data }: FounderDashboardProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState<FounderProduct>("product1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function logout() {
    await fetch("/api/founder/logout", { method: "POST" });
    router.refresh();
  }

  async function grantAccess() {
    setBusy(true);
    try {
      const response = await fetch("/api/founder/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product, note }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: { granted?: string[] };
        error?: { message?: string };
      };
      if (!response.ok || !json.ok) {
        toast.error(json.error?.message ?? "Grant failed");
        return;
      }
      toast.success(
        `Granted: ${(json.data?.granted ?? []).join(", ")} for ${email.trim().toLowerCase()}`,
      );
      setEmail("");
      setNote("");
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeAccess(
    targetEmail: string,
    targetProduct: "product1" | "product2",
  ) {
    if (
      !window.confirm(
        `Revoke ${targetProduct === "product1" ? "Product 1" : "Product 2"} for ${targetEmail}?`,
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/founder/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, product: targetProduct }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: { message?: string };
        error?: { message?: string };
      };
      if (!response.ok || !json.ok) {
        toast.error(json.error?.message ?? "Revoke failed");
        return;
      }
      toast.success(json.data?.message ?? "Revoked");
      router.refresh();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const { overview } = data;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Founder dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            Product overview
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Secret path active. Data is split by product.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={logout}>
          Log out
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Customers" value={overview.totalCustomers} />
        <Stat label="Product 1 access" value={overview.product1Count} />
        <Stat label="Product 2 access" value={overview.product2Count} />
        <Stat label="Both products" value={overview.bothCount} />
        <Stat label="Unclaimed P1 grants" value={overview.unclaimedProduct1} />
        <Stat label="Unclaimed P2 grants" value={overview.unclaimedProduct2} />
        <Stat label="Pending Dodo claims" value={overview.pendingPurchases} />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Grant access</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Add an email. They claim it when they log in with that same email.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="grant-email">Customer email</Label>
            <Input
              id="grant-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-product">Product</Label>
            <select
              id="grant-product"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={product}
              onChange={(e) => setProduct(e.target.value as FounderProduct)}
            >
              <option value="product1">Product 1 (chatbot)</option>
              <option value="product2">Product 2 (location leads)</option>
              <option value="both">Both products</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-note">Note (optional)</Label>
            <Input
              id="grant-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paid offline"
            />
          </div>
        </div>
        <Button
          type="button"
          className="mt-4"
          disabled={busy || !email.trim()}
          onClick={grantAccess}
        >
          Grant access
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          Product 1 — AI chatbot
        </h2>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Note</th>
                <th className="px-3 py-2 font-medium">Granted</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.product1Grants.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                    No manual Product 1 grants yet.
                  </td>
                </tr>
              ) : (
                data.product1Grants.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">
                      <ClaimBadge claimed={row.claimed} />
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {row.note ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => revokeAccess(row.email, "product1")}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Bot / usage</th>
                <th className="px-3 py-2 font-medium">Leads</th>
                <th className="px-3 py-2 font-medium">Granted at</th>
              </tr>
            </thead>
            <tbody>
              {data.product1Customers.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                    No Product 1 customers yet.
                  </td>
                </tr>
              ) : (
                data.product1Customers.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.email}</div>
                      <div className="text-xs text-zinc-500">
                        {row.full_name ?? "No name"} · {row.mobile_phone ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{row.source}</Badge>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">
                      {row.bot_id ?? "—"}
                      <div className="text-xs">
                        msgs {row.messages_used_this_period ?? 0}
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.chatbot_leads_count}</td>
                    <td className="px-3 py-2 text-zinc-500">
                      {formatDate(row.lifetime_access_granted_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          Product 2 — Location leads
        </h2>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Note</th>
                <th className="px-3 py-2 font-medium">Granted</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.product2Grants.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                    No Product 2 grants yet.
                  </td>
                </tr>
              ) : (
                data.product2Grants.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">
                      <ClaimBadge claimed={row.claimed} />
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {row.note ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => revokeAccess(row.email, "product2")}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Credits</th>
                <th className="px-3 py-2 font-medium">Searches</th>
                <th className="px-3 py-2 font-medium">Leads</th>
                <th className="px-3 py-2 font-medium">Granted at</th>
              </tr>
            </thead>
            <tbody>
              {data.product2Customers.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                    No Product 2 customers yet.
                  </td>
                </tr>
              ) : (
                data.product2Customers.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.email}</div>
                      <div className="text-xs text-zinc-500">
                        {row.full_name ?? "No name"} · {row.mobile_phone ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {row.maps_lead_credits_used} / {row.maps_lead_credits_limit}
                    </td>
                    <td className="px-3 py-2">{row.searches_count}</td>
                    <td className="px-3 py-2">{row.maps_leads_count}</td>
                    <td className="px-3 py-2 text-zinc-500">
                      {formatDate(row.maps_access_granted_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-zinc-400">Private founder console</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function ClaimBadge({ claimed }: { claimed: boolean }) {
  return (
    <Badge variant={claimed ? "default" : "secondary"}>
      {claimed ? "Claimed" : "Unclaimed"}
    </Badge>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
