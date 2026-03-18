import Link from "next/link";
import {
  Zap, Workflow, Brain, Shield, Clock, Code2,
  ArrowRight, GitBranch, Repeat, Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NexusFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/workflows"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500" />
            Open Source Workflow Automation
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Automate Everything with{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              AI-Powered
            </span>{" "}
            Workflows
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            NexusFlow is an open-source workflow automation platform with 50+
            integration nodes and built-in AI capabilities. Build complex
            automations visually, connect your favorite tools, and let AI handle
            the rest.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              Browse Templates
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold">
            Everything You Need to Automate
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            A complete platform for building, deploying, and monitoring workflows
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Workflow,
                title: "Visual Workflow Editor",
                description:
                  "Drag-and-drop editor with 50+ nodes. Build complex workflows visually without writing code.",
              },
              {
                icon: Brain,
                title: "AI-Powered Nodes",
                description:
                  "Built-in LLM Chat, Summarize, Classify, Extract, Translate, and Sentiment Analysis nodes.",
              },
              {
                icon: Globe,
                title: "50+ Integrations",
                description:
                  "HTTP, Email, Slack, Discord, Google Sheets, databases, S3, Stripe, GitHub, and many more.",
              },
              {
                icon: GitBranch,
                title: "Conditional Logic",
                description:
                  "Branch workflows based on conditions with expression editor. Support for complex boolean logic.",
              },
              {
                icon: Repeat,
                title: "Loops & Iteration",
                description:
                  "Iterate over arrays with configurable concurrency and batch processing.",
              },
              {
                icon: Shield,
                title: "Credential Vault",
                description:
                  "AES-256-GCM encrypted storage for API keys and connection strings. Zero plaintext storage.",
              },
              {
                icon: Clock,
                title: "Multiple Triggers",
                description:
                  "Webhook, cron schedule, email received, file upload, or manual triggers for any workflow.",
              },
              {
                icon: Code2,
                title: "REST API",
                description:
                  "Full REST API for triggering workflows, managing credentials, and viewing execution history.",
              },
              {
                icon: Zap,
                title: "Error Handling",
                description:
                  "Built-in retry with exponential backoff, fallback values, and notification on failure.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">Ready to Automate?</h2>
          <p className="mt-4 text-muted-foreground">
            Start building workflows in minutes. No credit card required.
          </p>
          <div className="mt-8">
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Launch NexusFlow
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">NexusFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Open-source workflow automation. Built with Next.js, Supabase, and
            BullMQ.
          </p>
        </div>
      </footer>
    </div>
  );
}
