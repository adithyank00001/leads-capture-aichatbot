import { Button } from "@/components/ui/button";
import { formatLeadCustomFields } from "@/lib/dashboard/lead-custom-fields";

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  custom_fields: Record<string, string> | null;
  page_url: string | null;
  created_at: string;
};

type LeadsMobileCardProps = {
  lead: Lead;
  fieldLabels: Record<string, string>;
  onViewChat: (leadId: string) => void;
  onDelete: (leadId: string) => void;
  isDeleting: boolean;
};

export function LeadsMobileCard({
  lead,
  fieldLabels,
  onViewChat,
  onDelete,
  isDeleting,
}: LeadsMobileCardProps) {
  const customFields = formatLeadCustomFields(lead.custom_fields, fieldLabels);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">{lead.name ?? "—"}</p>
        <p className="text-sm text-muted-foreground">{lead.phone ?? "—"}</p>
        {lead.email ? (
          <p className="text-sm text-muted-foreground">{lead.email}</p>
        ) : null}
        {customFields.map((field) => (
          <p key={field.label} className="text-sm text-muted-foreground">
            {field.label}: {field.value}
          </p>
        ))}
      </div>
      {lead.page_url ? (
        <p className="truncate text-xs text-muted-foreground">{lead.page_url}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {new Date(lead.created_at).toLocaleString()}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onViewChat(lead.id)}
        >
          View conversation
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onDelete(lead.id)}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
