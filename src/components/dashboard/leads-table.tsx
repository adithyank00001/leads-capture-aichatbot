"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DeleteLeadDialog } from "@/components/dashboard/delete-lead-dialog";
import { LeadsEmptyState } from "@/components/dashboard/leads-empty-state";
import { LeadsMobileCard } from "@/components/dashboard/leads-mobile-card";
import { LeadChatModal } from "@/components/dashboard/lead-chat-modal";
import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { formatLeadCustomFields } from "@/lib/dashboard/lead-custom-fields";
import {
  getLeadsDeleteErrorMessage,
  getLeadsLoadErrorMessage,
} from "@/lib/dashboard/customer-errors";
import { CHAT_RETENTION_NOTICE } from "@/lib/chat/retention";

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  custom_fields: Record<string, string> | null;
  page_url: string | null;
  session_id: string;
  created_at: string;
};

type LeadsResponse = {
  ok: boolean;
  data?: {
    leads: Lead[];
    botId: string;
    fieldLabels: Record<string, string>;
  };
  error?: {
    message: string;
  };
};

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteLeadId, setPendingDeleteLeadId] = useState<string | null>(
    null,
  );

  async function loadLeads() {
    try {
      const { response, body: result } = await fetchJsonWithTimeout<LeadsResponse>(
        "/api/dashboard/leads",
      );

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error?.message ?? "Could not load leads.");
      }

      setLeads(result.data.leads);
      setFieldLabels(result.data.fieldLabels ?? {});
    } catch (loadError) {
      setError(getLeadsLoadErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLeads();
  }, []);

  function openDeleteDialog(leadId: string) {
    setPendingDeleteLeadId(leadId);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteLead(leadId: string) {
    setDeletingLeadId(leadId);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/leads/${leadId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: { message: string };
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message ?? "Could not delete lead.");
      }

      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
      }

      toast.success("Lead deleted");
      setDeleteDialogOpen(false);
      await loadLeads();
    } catch (deleteError) {
      setError(getLeadsDeleteErrorMessage(deleteError));
    } finally {
      setDeletingLeadId(null);
      setPendingDeleteLeadId(null);
    }
  }

  const pendingDeleteLead = leads.find((lead) => lead.id === pendingDeleteLeadId);

  if (loading) {
    return <PageLoadingSkeleton variant="leads" />;
  }

  return (
    <>
      <Card className="shadow-md ring-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Leads</CardTitle>
              <CardDescription className="mt-1">{CHAT_RETENTION_NOTICE}</CardDescription>
            </div>
            <Badge variant="secondary">{leads.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {leads.length === 0 ? (
            <LeadsEmptyState />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source page</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{lead.phone ?? "—"}</div>
                          {lead.email ? (
                            <div className="text-sm text-muted-foreground">
                              {lead.email}
                            </div>
                          ) : null}
                          {formatLeadCustomFields(lead.custom_fields, fieldLabels).map(
                            (field) => (
                              <div
                                key={field.label}
                                className="text-sm text-muted-foreground"
                              >
                                {field.label}: {field.value}
                              </div>
                            ),
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {lead.page_url ?? "—"}
                        </TableCell>
                        <TableCell>
                          {new Date(lead.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLeadId(lead.id)}
                            >
                              View chat
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(lead.id)}
                              disabled={deletingLeadId === lead.id}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {leads.map((lead) => (
                  <LeadsMobileCard
                    key={lead.id}
                    lead={lead}
                    fieldLabels={fieldLabels}
                    onViewChat={setSelectedLeadId}
                    onDelete={openDeleteDialog}
                    isDeleting={deletingLeadId === lead.id}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeleteLeadDialog
        leadId={pendingDeleteLeadId}
        leadName={pendingDeleteLead?.name ?? undefined}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteLead}
        isDeleting={deletingLeadId !== null}
      />

      {selectedLeadId ? (
        <LeadChatModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      ) : null}
    </>
  );
}
