import { ApiTestPanel } from "@/components/api-test";
import { DatabaseTestPanel } from "@/components/database-test";
import { HealthCheckPanel } from "@/components/health-check";
import { getEmbedPath, publicConfig } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Phase 7
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">
            {publicConfig.appName}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600">
            Customer dashboard, embed chatbot, and smoke tests. Customers can
            sign up to manage their own bot knowledge and leads.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/login"
              className="inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Customer login
            </a>
            <a
              href="/signup"
              className="inline-flex rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Customer sign up
            </a>
            <a
              href="/dashboard/settings"
              className="inline-flex rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Dashboard
            </a>
            <a
              href={getEmbedPath(publicConfig.defaultBotId)}
              className="inline-flex rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Open chatbot page
            </a>
            <a
              href="/demo-site/index.html"
              className="inline-flex rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Demo customer website
            </a>
          </div>
        </header>

        <HealthCheckPanel />
        <ApiTestPanel />
        <DatabaseTestPanel />

        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
          <h2 className="font-medium text-zinc-900">Embed script</h2>
          <p className="mt-2 leading-6">
            Customers paste this one line into their website:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100">
{`<script
  src="${publicConfig.appUrl}/widget.js"
  data-bot-id="${publicConfig.defaultBotId}"
  async
></script>`}
          </pre>
          <ul className="mt-3 space-y-2">
            <li>
              Chatbot iframe page:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5">
                {getEmbedPath(publicConfig.defaultBotId)}
              </code>
            </li>
            <li>
              Widget loader:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5">
                /widget.js
              </code>
            </li>
            <li>
              Demo customer site:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5">
                /demo-site/index.html
              </code>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
