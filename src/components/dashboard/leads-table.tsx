"use client";

import { useEffect, useState } from "react";

import { CHAT_RETENTION_NOTICE } from "@/lib/chat/retention";

import { LeadChatModal } from "./lead-chat-modal";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  page_url: string | null;
  session_id: string;
  created_at: string;
};

type LeadsResponse = {
  ok: boolean;
  data?: {
    leads: Lead[];
    botId: string;
  };
  error?: {
    message: string;
  };
};

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  async function loadLeads() {
    try {
      const response = await fetch("/api/dashboard/leads");
      const result = (await response.json()) as LeadsResponse;

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error?.message ?? "Could not load leads.");
      }

      setLeads(result.data.leads);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load leads.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function handleDeleteLead(leadId: string) {
    if (!window.confirm("Delete this lead and all chat messages?")) {
      return;
    }

    setDeletingLeadId(leadId);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/leads/${leadId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { ok: boolean; error?: { message: string } };

      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message ?? "Could not delete lead.");
      }

      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
      }

      await loadLeads();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Could not delete lead.",
      );
    } finally {
      setDeletingLeadId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading leads...</p>;
  }

  return (
    <>
      <section className="space-y-4 border border-zinc-300 bg-white p-4">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-zinc-600">{CHAT_RETENTION_NOTICE}</p>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {leads.length === 0 ? (
          <p className="text-sm text-zinc-600">No leads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-zinc-300 text-left text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="border border-zinc-300 px-2 py-2">Name</th>
                  <th className="border border-zinc-300 px-2 py-2">Phone</th>
                  <th className="border border-zinc-300 px-2 py-2">Email</th>
                  <th className="border border-zinc-300 px-2 py-2">Page URL</th>
                  <th className="border border-zinc-300 px-2 py-2">Created</th>
                  <th className="border border-zinc-300 px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="border border-zinc-300 px-2 py-2">{lead.name}</td>
                    <td className="border border-zinc-300 px-2 py-2">{lead.phone}</td>
                    <td className="border border-zinc-300 px-2 py-2">
                      {lead.email ?? "-"}
                    </td>
                    <td className="border border-zinc-300 px-2 py-2">
                      {lead.page_url ?? "-"}
                    </td>
                    <td className="border border-zinc-300 px-2 py-2">
                      {new Date(lead.created_at).toLocaleString()}
                    </td>
                    <td className="border border-zinc-300 px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
                        >
                          View chat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(lead.id)}
                          disabled={deletingLeadId === lead.id}
                          className="border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingLeadId === lead.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedLeadId ? (
        <LeadChatModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      ) : null}
    </>
  );
}
