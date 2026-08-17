import "server-only";

export function isWidgetMonitoringEnabled() {
  return process.env.WIDGET_MONITORING_ENABLED === "true";
}
