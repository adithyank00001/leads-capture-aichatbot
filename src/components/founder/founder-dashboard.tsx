"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FounderDashboardData, FounderProduct } from "@/lib/founder/data";

type ViewProduct = "product1" | "product2";

type FounderDashboardProps = {
  data: FounderDashboardData;
};

export function FounderDashboard({ data }: FounderDashboardProps) {
  const router = useRouter();
  const [viewProduct, setViewProduct] = useState<ViewProduct>("product2");
  const [email, setEmail] = useState("");
  const [grantProduct, setGrantProduct] = useState<FounderProduct>("product2");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const isProduct1 = viewProduct === "product1";
  const { overview } = data;

  async function logout() {
    await fetch("/api/founder/logout", { method: "POST" });
    router.refresh();
  }

  function onViewProductChange(next: ViewProduct) {
    setViewProduct(next);
    setGrantProduct(next);
  }

  async function grantAccess() {
    setBusy(true);
    try {
      const response = await fetch("/api/founder/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product: grantProduct, note }),
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:space-y-8 md:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 md:text-xs">
            Founder dashboard
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-zinc-900 md:text-2xl">
            Product overview
          </h1>
          <p className="mt-1 text-base leading-relaxed text-zinc-500 md:text-sm">
            Pick one product below. Only that product’s data is shown.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={logout}
          className="h-11 text-base md:h-9 md:text-sm"
        >
          Log out
        </Button>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <Label htmlFor="view-product" className="text-base md:text-sm">
          Which product to view
        </Label>
        <select
          id="view-product"
          className="mt-2 flex h-12 w-full max-w-md rounded-md border border-input bg-transparent px-3 text-base font-medium md:h-11 md:text-sm"
          value={viewProduct}
          onChange={(e) => onViewProductChange(e.target.value as ViewProduct)}
        >
          <option value="product1">
            Product 1 — AI chatbot (website leads)
          </option>
          <option value="product2">
            Product 2 — Location based B2B leads
          </option>
        </select>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total customers" value={overview.totalCustomers} />
        {isProduct1 ? (
          <>
            <Stat label="Product 1 access" value={overview.product1Count} />
            <Stat
              label="Unclaimed Product 1 grants"
              value={overview.unclaimedProduct1}
            />
            <Stat
              label="Pending Dodo claims"
              value={overview.pendingPurchases}
            />
          </>
        ) : (
          <>
            <Stat label="Product 2 access" value={overview.product2Count} />
            <Stat
              label="Unclaimed Product 2 grants"
              value={overview.unclaimedProduct2}
            />
            <Stat label="Both products" value={overview.bothCount} />
          </>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <h2 className="text-xl font-semibold text-zinc-900 md:text-lg">
          Grant access
        </h2>
        <p className="mt-1 text-base leading-relaxed text-zinc-500 md:text-sm">
          Add an email. They claim it when they log in with that same email.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="grant-email" className="text-base md:text-sm">
              Customer email
            </Label>
            <Input
              id="grant-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@example.com"
              className="h-11 text-base md:h-9 md:text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-product" className="text-base md:text-sm">
              Give access to
            </Label>
            <select
              id="grant-product"
              className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-base md:h-9 md:text-sm"
              value={grantProduct}
              onChange={(e) =>
                setGrantProduct(e.target.value as FounderProduct)
              }
            >
              <option value="product1">Product 1 only</option>
              <option value="product2">Product 2 only</option>
              <option value="both">Both products</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-note" className="text-base md:text-sm">
              Note (optional)
            </Label>
            <Input
              id="grant-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Paid offline"
              className="h-11 text-base md:h-9 md:text-sm"
            />
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 h-11 w-full text-base md:h-9 md:w-auto md:text-sm"
          disabled={busy || !email.trim()}
          onClick={grantAccess}
        >
          Grant access
        </Button>
      </section>

      {isProduct1 ? (
        <Product1Panels
          data={data}
          busy={busy}
          onRevoke={(targetEmail) => revokeAccess(targetEmail, "product1")}
        />
      ) : (
        <>
          <TrialLinksPanel />
          <Product2Panels
            data={data}
            busy={busy}
            onRevoke={(targetEmail) => revokeAccess(targetEmail, "product2")}
          />
        </>
      )}

      <p className="text-sm text-zinc-400 md:text-xs">Private founder console</p>
    </div>
  );
}

type TrialLinkRow = {
  id: string;
  token: string;
  note: string | null;
  status: string;
  search_used: boolean;
  trial_started_at: string | null;
  expires_at: string | null;
  created_at: string;
  url: string;
};

function TrialLinksPanel() {
  const [links, setLinks] = useState<TrialLinkRow[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadLinks();
  }, []);

  async function loadLinks() {
    try {
      const response = await fetch("/api/founder/trial-links");
      const json = (await response.json()) as {
        ok: boolean;
        data?: { links?: TrialLinkRow[] };
        error?: { message?: string };
      };
      if (!response.ok || !json.ok) {
        toast.error(json.error?.message ?? "Could not load trial links");
        return;
      }
      setLinks(json.data?.links ?? []);
    } catch {
      toast.error("Could not load trial links.");
    }
  }

  async function createLink() {
    setBusy(true);
    try {
      const response = await fetch("/api/founder/trial-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: { url?: string };
        error?: { message?: string };
      };
      if (!response.ok || !json.ok || !json.data?.url) {
        toast.error(json.error?.message ?? "Could not create trial link");
        return;
      }
      try {
        await navigator.clipboard.writeText(json.data.url);
        toast.success("Trial link created and copied");
      } catch {
        toast.success("Trial link created");
      }
      setNote("");
      await loadLinks();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function disableLink(id: string) {
    if (!window.confirm("Disable this trial link?")) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/founder/trial-links/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !json.ok) {
        toast.error(json.error?.message ?? "Disable failed");
        return;
      }
      toast.success("Trial link disabled");
      await loadLinks();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 md:text-lg">
          Product 2 — Temporary trial links
        </h2>
        <p className="mt-1 text-base leading-relaxed text-zinc-500 md:text-sm">
          Create a random link guests can open without login. One search, 10
          phone leads, view only, expires 2 hours after first success.
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 space-y-2 sm:min-w-[200px]">
          <Label htmlFor="trial-note" className="text-base md:text-sm">
            Note (optional)
          </Label>
          <Input
            id="trial-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Prospect name"
            className="h-11 text-base md:h-9 md:text-sm"
          />
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={createLink}
          className="h-11 w-full text-base sm:w-auto md:h-9 md:text-sm"
        >
          Create trial link
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <p className="border-b bg-zinc-50 px-3 py-2 text-sm text-zinc-500 md:hidden">
          Swipe table sideways to see all columns
        </p>
        <table className="min-w-[720px] w-full text-left text-base md:min-w-full md:text-sm">
          <thead className="border-b bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-3 py-3 font-medium md:py-2">Link</th>
              <th className="px-3 py-3 font-medium md:py-2">Status</th>
              <th className="px-3 py-3 font-medium md:py-2">Used</th>
              <th className="px-3 py-3 font-medium md:py-2">Expires</th>
              <th className="px-3 py-3 font-medium md:py-2">Note</th>
              <th className="px-3 py-3 font-medium md:py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-zinc-500" colSpan={6}>
                  No trial links yet.
                </td>
              </tr>
            ) : (
              links.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="max-w-[220px] truncate px-3 py-3 font-mono text-sm md:py-2 md:text-xs">
                    {row.token}
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    <Badge variant="outline" className="text-sm md:text-xs">
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    {row.search_used ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {formatDate(row.expires_at)}
                  </td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {row.note ?? "—"}
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => copyUrl(row.url)}
                        className="h-10 px-3 text-base md:h-8 md:text-sm"
                      >
                        Copy
                      </Button>
                      {row.status !== "disabled" && row.status !== "expired" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => disableLink(row.id)}
                          className="h-10 px-3 text-base md:h-8 md:text-sm"
                        >
                          Disable
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Product1Panels({
  data,
  busy,
  onRevoke,
}: {
  data: FounderDashboardData;
  busy: boolean;
  onRevoke: (email: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 md:text-lg">
        Product 1 — Manual grants
      </h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <p className="border-b bg-zinc-50 px-3 py-2 text-sm text-zinc-500 md:hidden">
          Swipe table sideways to see all columns
        </p>
        <table className="min-w-[640px] w-full text-left text-base md:min-w-full md:text-sm">
          <thead className="border-b bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-3 py-3 font-medium md:py-2">Email</th>
              <th className="px-3 py-3 font-medium md:py-2">Status</th>
              <th className="px-3 py-3 font-medium md:py-2">Note</th>
              <th className="px-3 py-3 font-medium md:py-2">Granted</th>
              <th className="px-3 py-3 font-medium md:py-2">Action</th>
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
                  <td className="px-3 py-3 md:py-2">{row.email}</td>
                  <td className="px-3 py-3 md:py-2">
                    <ClaimBadge claimed={row.claimed} />
                  </td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {row.note ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => onRevoke(row.email)}
                      className="h-10 px-3 text-base md:h-8 md:text-sm"
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

      <h2 className="text-xl font-semibold text-zinc-900 md:text-lg">
        Product 1 — Customers with access
      </h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <p className="border-b bg-zinc-50 px-3 py-2 text-sm text-zinc-500 md:hidden">
          Swipe table sideways to see all columns
        </p>
        <table className="min-w-[720px] w-full text-left text-base md:min-w-full md:text-sm">
          <thead className="border-b bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-3 py-3 font-medium md:py-2">Customer</th>
              <th className="px-3 py-3 font-medium md:py-2">Source</th>
              <th className="px-3 py-3 font-medium md:py-2">Bot / usage</th>
              <th className="px-3 py-3 font-medium md:py-2">Leads</th>
              <th className="px-3 py-3 font-medium md:py-2">Granted at</th>
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
                  <td className="px-3 py-3 md:py-2">
                    <div className="font-medium">{row.email}</div>
                    <div className="text-sm text-zinc-500 md:text-xs">
                      {row.full_name ?? "No name"} · {row.mobile_phone ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    <Badge variant="outline" className="text-sm md:text-xs">
                      {row.source}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-zinc-600 md:py-2">
                    {row.bot_id ?? "—"}
                    <div className="text-sm md:text-xs">
                      msgs {row.messages_used_this_period ?? 0}
                    </div>
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    {row.chatbot_leads_count}
                  </td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {formatDate(row.lifetime_access_granted_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Product2Panels({
  data,
  busy,
  onRevoke,
}: {
  data: FounderDashboardData;
  busy: boolean;
  onRevoke: (email: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 md:text-lg">
        Product 2 — Manual grants
      </h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <p className="border-b bg-zinc-50 px-3 py-2 text-sm text-zinc-500 md:hidden">
          Swipe table sideways to see all columns
        </p>
        <table className="min-w-[640px] w-full text-left text-base md:min-w-full md:text-sm">
          <thead className="border-b bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-3 py-3 font-medium md:py-2">Email</th>
              <th className="px-3 py-3 font-medium md:py-2">Status</th>
              <th className="px-3 py-3 font-medium md:py-2">Note</th>
              <th className="px-3 py-3 font-medium md:py-2">Granted</th>
              <th className="px-3 py-3 font-medium md:py-2">Action</th>
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
                  <td className="px-3 py-3 md:py-2">{row.email}</td>
                  <td className="px-3 py-3 md:py-2">
                    <ClaimBadge claimed={row.claimed} />
                  </td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {row.note ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => onRevoke(row.email)}
                      className="h-10 px-3 text-base md:h-8 md:text-sm"
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

      <h2 className="text-xl font-semibold text-zinc-900 md:text-lg">
        Product 2 — Customers with access
      </h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <p className="border-b bg-zinc-50 px-3 py-2 text-sm text-zinc-500 md:hidden">
          Swipe table sideways to see all columns
        </p>
        <table className="min-w-[720px] w-full text-left text-base md:min-w-full md:text-sm">
          <thead className="border-b bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-3 py-3 font-medium md:py-2">Customer</th>
              <th className="px-3 py-3 font-medium md:py-2">Credits</th>
              <th className="px-3 py-3 font-medium md:py-2">Searches</th>
              <th className="px-3 py-3 font-medium md:py-2">Leads</th>
              <th className="px-3 py-3 font-medium md:py-2">Granted at</th>
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
                  <td className="px-3 py-3 md:py-2">
                    <div className="font-medium">{row.email}</div>
                    <div className="text-sm text-zinc-500 md:text-xs">
                      {row.full_name ?? "No name"} · {row.mobile_phone ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    {row.maps_lead_credits_used} / {row.maps_lead_credits_limit}
                  </td>
                  <td className="px-3 py-3 md:py-2">{row.searches_count}</td>
                  <td className="px-3 py-3 md:py-2">{row.maps_leads_count}</td>
                  <td className="px-3 py-3 text-zinc-500 md:py-2">
                    {formatDate(row.maps_access_granted_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 md:py-3">
      <div className="text-sm text-zinc-500 md:text-xs">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-zinc-900 md:text-2xl">
        {value}
      </div>
    </div>
  );
}

function ClaimBadge({ claimed }: { claimed: boolean }) {
  return (
    <Badge
      variant={claimed ? "default" : "secondary"}
      className="text-sm md:text-xs"
    >
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
