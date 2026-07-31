"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  embedTroubleshootingEntries,
  type EmbedHelpEntry,
} from "@/lib/dashboard/embed-help";

function HelpEntryCard({ entry }: { entry: EmbedHelpEntry }) {
  return (
    <Card size="sm" className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-sm">{entry.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Issue: </span>
          {entry.issue}
        </p>
        <p>
          <span className="font-medium text-foreground">What to do: </span>
          {entry.action}
        </p>
        <p>
          <span className="font-medium text-foreground">Still stuck? </span>
          {entry.support}
        </p>
      </CardContent>
    </Card>
  );
}

export function EmbedTroubleshooting() {
  return (
    <Collapsible>
      <CollapsibleTrigger className="text-sm font-medium text-primary hover:underline">
        Having trouble?
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-3">
        {embedTroubleshootingEntries.map((entry) => (
          <HelpEntryCard key={entry.id} entry={entry} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
