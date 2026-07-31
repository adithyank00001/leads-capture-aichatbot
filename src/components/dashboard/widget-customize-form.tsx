"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";
import { WidgetPreview } from "@/components/dashboard/widget-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  createCustomLeadFieldId,
  getLeadFieldDisplayName,
  isCustomLeadFieldId,
  LEAD_FIELD_IDS,
  LEAD_FIELD_TYPE_LABELS,
  MAX_LEAD_FIELDS,
  type LeadFieldConfig,
  type LeadFieldId,
  type WidgetSettings,
} from "@/lib/widget/types";

type WidgetSettingsResponse = {
  ok: boolean;
  data?: {
    settings: WidgetSettings;
  };
  error?: {
    message: string;
  };
};

type BotNameResponse = {
  ok: boolean;
  data?: {
    bot: {
      business_name: string;
    };
  };
};

export function WidgetCustomizeForm() {
  const [businessName, setBusinessName] = useState("Your business");
  const [headerColor, setHeaderColor] = useState("#075E54");
  const [accentColor, setAccentColor] = useState("#25D366");
  const [leadFormEnabled, setLeadFormEnabled] = useState(true);
  const [leadFields, setLeadFields] = useState<LeadFieldConfig[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStandardToAdd = useMemo(() => {
    const included = new Set(leadFields.map((field) => field.id));
    return LEAD_FIELD_IDS.filter((id) => !included.has(id));
  }, [leadFields]);

  const canAddMoreFields = leadFields.length < MAX_LEAD_FIELDS;

  useEffect(() => {
    async function loadSettings() {
      try {
        const [settingsResult, botResult] = await Promise.all([
          fetchJsonWithTimeout<WidgetSettingsResponse>(
            "/api/dashboard/widget-settings",
          ),
          fetchJsonWithTimeout<BotNameResponse>("/api/dashboard/bot"),
        ]);

        if (!settingsResult.response.ok || !settingsResult.body.ok) {
          throw new Error(
            settingsResult.body.error?.message ?? "Could not load widget settings.",
          );
        }

        const settings = settingsResult.body.data?.settings;

        if (!settings) {
          throw new Error("Widget settings were missing from the response.");
        }

        setHeaderColor(settings.headerColor);
        setAccentColor(settings.accentColor);
        setLeadFormEnabled(settings.leadFormEnabled);
        setLeadFields(settings.leadFields);
        setUpdatedAt(settings.updatedAt);

        if (botResult.response.ok && botResult.body.ok && botResult.body.data) {
          setBusinessName(botResult.body.data.bot.business_name);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load widget settings.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, []);

  function updateField(id: string, patch: Partial<LeadFieldConfig>) {
    setLeadFields((current) =>
      current.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  }

  function removeField(id: string) {
    if (leadFields.length <= 1) {
      setError("Keep at least one form field.");
      return;
    }

    setError(null);
    setLeadFields((current) => current.filter((field) => field.id !== id));
  }

  function addStandardField(id: LeadFieldId) {
    if (!canAddMoreFields) {
      return;
    }

    setError(null);
    setLeadFields((current) => [
      ...current,
      {
        id,
        required: id !== "email",
        label:
          id === "email"
            ? "Email"
            : LEAD_FIELD_TYPE_LABELS[id],
      },
    ]);
  }

  function addCustomField() {
    if (!canAddMoreFields) {
      return;
    }

    setError(null);
    setLeadFields((current) => [
      ...current,
      {
        id: createCustomLeadFieldId(),
        required: false,
        label: "Custom field",
      },
    ]);
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    try {
      const { response, body } = await fetchJsonWithTimeout<WidgetSettingsResponse>(
        "/api/dashboard/widget-settings",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headerColor,
            accentColor,
            leadFormEnabled,
            leadFields,
          }),
        },
      );

      if (!response.ok || !body.ok || !body.data?.settings) {
        throw new Error(body.error?.message ?? "Could not save widget settings.");
      }

      const settings = body.data.settings;
      setHeaderColor(settings.headerColor);
      setAccentColor(settings.accentColor);
      setLeadFormEnabled(settings.leadFormEnabled);
      setLeadFields(settings.leadFields);
      setUpdatedAt(settings.updatedAt);
      toast.success("Chat widget updated.");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Could not save widget settings.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <PageLoadingSkeleton variant="settings" />;
  }

  const previewSettings = {
    headerColor,
    accentColor,
    leadFormEnabled,
    leadFields,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customize chatbot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Change colors and lead form fields. Visitors see updates without reinstalling
          the embed code.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>
                Background stays white. Pick a header color and an accent color for
                icons and buttons.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="header-color">Header color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="header-color"
                    type="color"
                    value={headerColor}
                    onChange={(event) => setHeaderColor(event.target.value)}
                    className="h-10 w-16 p-1"
                  />
                  <Input
                    value={headerColor}
                    onChange={(event) => setHeaderColor(event.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    className="h-10 w-16 p-1"
                  />
                  <Input
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead form</CardTitle>
              <CardDescription>
                Ask visitors for details before chat, or let them message you
                right away.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-3 rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={leadFormEnabled}
                  onChange={(event) => setLeadFormEnabled(event.target.checked)}
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Collect visitor details</p>
                  <p className="text-sm text-muted-foreground">
                    When off, visitors can chat immediately without filling a
                    form. Your field settings stay saved if you turn this back
                    on.
                  </p>
                </div>
              </label>

              {leadFormEnabled ? (
                <>
                  <Alert>
                    <AlertTitle>Conversion tip</AlertTitle>
                    <AlertDescription>
                      <strong>2 fields convert best.</strong> Maximum{" "}
                      <strong>{MAX_LEAD_FIELDS} fields</strong> — more fields often
                      mean fewer people finish the form.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {leadFields.map((field) => (
                      <div
                        key={field.id}
                        className="rounded-xl border border-border p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {getLeadFieldDisplayName(field)}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeField(field.id)}
                            disabled={leadFields.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(event) =>
                                updateField(field.id, {
                                  required: event.target.checked,
                                })
                              }
                            />
                            Required
                          </label>
                          <div className="space-y-1">
                            <Label htmlFor={`label-${field.id}`}>Label</Label>
                            <Input
                              id={`label-${field.id}`}
                              value={field.label}
                              onChange={(event) =>
                                updateField(field.id, { label: event.target.value })
                              }
                              placeholder={
                                isCustomLeadFieldId(field.id)
                                  ? "Example: City or Budget"
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {canAddMoreFields ? (
                    <div className="flex flex-wrap gap-2">
                      {availableStandardToAdd.map((fieldId) => (
                        <Button
                          key={fieldId}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addStandardField(fieldId)}
                        >
                          + Add {LEAD_FIELD_TYPE_LABELS[fieldId]}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomField}
                      >
                        + Add custom field
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Lead form is off. Visitors will only see the chat box and can
                  send messages directly.
                </p>
              )}
            </CardContent>
          </Card>

          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Live preview</p>
          <WidgetPreview businessName={businessName} settings={previewSettings} />
          {updatedAt ? (
            <p className="text-xs text-muted-foreground">
              Last saved: {new Date(updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
