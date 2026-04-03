import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Boxes,
  Receipt,
  LineChart,
  Users,
  Cloud,
  Clock,
  ClipboardList,
  ScanLine,
  Lock,
  Star,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AccordionItem } from "@/components/ui/Accordion";

function useScrolledShadow() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-surface px-4 py-3 shadow-card">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  note,
  features,
  highlight,
}: {
  name: string;
  price: string;
  note: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.10)]",
        highlight ? "border-accent/40" : "border-ink/10"
      )}
    >
      {highlight ? (
        <div className="absolute -top-3 left-6">
          <Badge tone="accent" className="px-3 py-1">
            Most popular
          </Badge>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{name}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {price}
            <span className="ml-1 text-sm font-medium text-ink-muted">
              /mo
            </span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">{note}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-ink-muted">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 text-accent" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link to="/register">
          <Button className={cn("w-full", highlight ? "" : "bg-primary")}>
            Get started <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function LandingPage() {
  const scrolled = useScrolledShadow();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const price = useMemo(() => {
    const yearly = billing === "yearly";
    return {
      starter: yearly ? "19" : "29",
      pro: yearly ? "49" : "69",
      ent: yearly ? "99" : "149",
      suffix: yearly ? "Billed yearly (save ~20%)" : "Billed monthly",
    };
  }, [billing]);

  const features = [
    {
      icon: Shield,
      title: "Multi-tenant isolation",
      desc: "Every pharmacy runs independently with strict tenant-scoped data access.",
    },
    {
      icon: Boxes,
      title: "Inventory tracking",
      desc: "Real-time stock levels, low-stock alerts, and expiry warnings.",
    },
    {
      icon: Receipt,
      title: "Sales & billing",
      desc: "Fast checkout, receipts, and easy sales history with audit trails.",
    },
    {
      icon: LineChart,
      title: "Analytics dashboard",
      desc: "Revenue trends, inventory health, and performance insights.",
    },
    {
      icon: Users,
      title: "Roles & permissions",
      desc: "PHARMACY_ADMIN and staff roles with scoped access to features.",
    },
    {
      icon: Cloud,
      title: "Cloud access",
      desc: "Secure access anywhere, on any device—built for scale.",
    },
    {
      icon: Clock,
      title: "Batch & expiry management",
      desc: "FIFO/FEFO workflows to reduce loss and keep patients safe.",
    },
    {
      icon: ClipboardList,
      title: "Suppliers & purchase flow",
      desc: "Manage suppliers, restocks, and movement history for accountability.",
    },
    {
      icon: ScanLine,
      title: "Integrations ready",
      desc: "Barcode scanners today, accounting/SMS/email tomorrow—SaaS friendly.",
    },
  ];

  return (
    <div className="min-h-screen bg-muted text-ink">
      {/* Navbar */}
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-transparent bg-muted/70 backdrop-blur supports-[backdrop-filter]:bg-muted/50",
          scrolled && "border-ink/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              Rx
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Rxora</p>
              <p className="text-[11px] text-ink-muted">
                NexPharm
              </p>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 text-sm text-ink-muted md:flex">
            <a href="#home" className="hover:text-ink">
              Home
            </a>
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <a href="#pricing" className="hover:text-ink">
              Pricing
            </a>
            <a
              href="#testimonials"
              className="hover:text-ink"
            >
              Testimonials
            </a>
            <a href="#contact" className="hover:text-ink">
              Contact
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-4">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Link to="/login">
              <Button variant="secondary" className="border-ink/15 bg-surface">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="shadow-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-72 w-[680px] -translate-x-1/2 rounded-full bg-gradient-to-r from-accent/25 via-primary/20 to-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-24 right-[-120px] h-72 w-72 rounded-full bg-gradient-to-br from-primary/20 to-accent/15 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <Badge tone="accent" className="px-3 py-1">
              Secure multi-tenant SaaS
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Modern Pharmacy Management, Simplified.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              Run and scale your pharmacy with a secure, multi-tenant platform
              built for efficiency, compliance-ready workflows, and growth.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/register" className="w-full sm:w-auto">
                <Button className="w-full">
                  Start Free Trial <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#contact" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full border-ink/15 bg-surface">
                  Book Demo
                </Button>
              </a>
            </div>

            <p className="mt-3 text-sm text-ink-muted">
              No credit card required • Cancel anytime
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat value="4.8/5" label="Avg rating" />
              <Stat value="500+" label="Pharmacies" />
              <Stat value="99.9%" label="Uptime" />
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-primary/15 to-accent/10 blur-2xl" />
            <div className="rounded-2xl border border-ink/10 bg-surface/80 p-4 shadow-card backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    Rx
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      NexPharm Dashboard
                    </p>
                    <p className="text-xs text-ink-muted">
                      Inventory • Sales • Alerts
                    </p>
                  </div>
                </div>
                <Badge tone="success">Live</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Card className="bg-muted/40 p-4 shadow-none">
                  <p className="text-xs text-ink-muted">Today’s sales</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    $3,420
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    +12% vs yesterday
                  </p>
                </Card>
                <Card className="bg-muted/40 p-4 shadow-none">
                  <p className="text-xs text-ink-muted">Low stock</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    7 items
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Restock suggested
                  </p>
                </Card>
              </div>

              <div className="mt-3 rounded-xl border border-ink/10 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">
                    Alerts
                  </p>
                  <Badge tone="warning">3</Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-ink-muted">
                    <Lock className="mt-0.5 size-4 text-accent" />
                    Tenant isolation enforced on all queries
                  </div>
                  <div className="flex items-start gap-2 text-ink-muted">
                    <Clock className="mt-0.5 size-4 text-warning" />
                    2 batches expiring in 14 days
                  </div>
                  <div className="flex items-start gap-2 text-ink-muted">
                    <Receipt className="mt-0.5 size-4 text-primary" />
                    Auto receipts enabled for POS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-y border-ink/10 bg-surface/60 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-sm font-medium text-ink-muted">
            Trusted by pharmacies across multiple countries
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-12 items-center justify-center rounded-xl border border-ink/10 bg-surface text-xs font-semibold text-ink-muted grayscale transition hover:grayscale-0"
              >
                PHARMACY {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            Everything you need to run a modern pharmacy
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Built for multi-tenant SaaS: secure by default, fast to use, and designed
            to scale across locations and countries.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-ink/10 bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.10)]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-accent">
                <f.icon className="size-5" strokeWidth={1.6} />
              </div>
              <p className="mt-4 text-base font-semibold text-ink">
                {f.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink">
              How it works
            </h2>
            <p className="mt-3 text-base text-ink-muted">
              Get started in minutes — your branding and tenant space are created automatically.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: "Register your pharmacy",
                desc: "Create a tenant, add details, upload your logo, and set your admin password.",
              },
              {
                title: "Customize your dashboard",
                desc: "Branding, users, roles, and preferences are scoped to your pharmacy.",
              },
              {
                title: "Start managing & scaling",
                desc: "Inventory, POS, reporting, and audit trails—all secured by tenant filters.",
              },
            ].map((s, idx) => (
              <div
                key={s.title}
                className="relative rounded-2xl border border-ink/10 bg-surface p-6 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <span className="text-sm font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-base font-semibold text-ink">
                    {s.title}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {s.desc}
                </p>
                {idx < 2 ? (
                  <div className="pointer-events-none absolute right-6 top-10 hidden text-ink/15 md:block">
                    <ArrowRight className="size-6" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product tabs (lightweight) */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            Built for daily operations
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Clean workflows for inventory, POS, reports, and settings—fast on desktop and mobile.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            {
              title: "Inventory",
              bullets: ["Expiry alerts", "Low-stock thresholds", "Batch tracking"],
              icon: Boxes,
            },
            {
              title: "POS",
              bullets: ["Barcode scanning", "Fast checkout", "Receipts & history"],
              icon: Receipt,
            },
            {
              title: "Reports",
              bullets: ["Daily & monthly revenue", "Stock health", "Trends"],
              icon: LineChart,
            },
            {
              title: "Settings & Users",
              bullets: ["Branding/logo", "Roles & permissions", "Audit logs"],
              icon: Users,
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-ink/10 bg-surface p-6 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-accent">
                  <c.icon className="size-5" strokeWidth={1.6} />
                </div>
                <p className="text-base font-semibold text-ink">
                  {c.title}
                </p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 text-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="border-y border-ink/10 bg-surface/60 py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink">
              Loved by teams that move fast
            </h2>
            <p className="mt-3 text-base text-ink-muted">
              A premium experience for admins and staff—without the complexity.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                name: "Aline M.",
                pharmacy: "Kigali Care Pharmacy",
                country: "Rwanda",
                quote:
                  "NexPharm transformed how we manage inventory and sales. Everything is seamless.",
              },
              {
                name: "David K.",
                pharmacy: "MetroRx",
                country: "Kenya",
                quote:
                  "The POS is fast, reporting is clear, and tenant isolation gives us real peace of mind.",
              },
              {
                name: "Sarah L.",
                pharmacy: "Coastal Pharmacy",
                country: "Tanzania",
                quote:
                  "Expiry alerts alone saved us money. Setup was quick and the UI feels premium.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-ink/10 bg-surface p-6 shadow-card"
              >
                <div className="flex items-center gap-1 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-warning stroke-warning" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  “{t.quote}”
                </p>
                <div className="mt-5 border-t border-ink/10 pt-4">
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-muted">
                    {t.pharmacy} • {t.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            Pricing that scales with you
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Start small, grow confidently. Upgrade when you need more users, locations, or features.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              billing === "monthly"
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-ink-muted hover:bg-muted"
            )}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              billing === "yearly"
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-ink-muted hover:bg-muted"
            )}
            onClick={() => setBilling("yearly")}
          >
            Yearly
          </button>
          <span className="ml-2 text-sm text-ink-muted">
            {price.suffix}
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PricingCard
            name="Starter"
            price={`$${price.starter}`}
            note="Best for a single location getting started"
            features={[
              "1 pharmacy location",
              "Up to 3 staff users",
              "Inventory + expiry alerts",
              "Basic reports",
            ]}
          />
          <PricingCard
            name="Professional"
            price={`$${price.pro}`}
            note="Most popular for growing pharmacies"
            features={[
              "Up to 3 locations",
              "Up to 15 staff users",
              "Advanced analytics",
              "Audit logs + exports",
              "Priority support",
            ]}
            highlight
          />
          <PricingCard
            name="Enterprise"
            price={`$${price.ent}`}
            note="For multi-branch operations at scale"
            features={[
              "Unlimited locations",
              "Unlimited users",
              "SLA + dedicated support",
              "Custom integrations (SMS/Accounting)",
              "Security reviews & onboarding",
            ]}
          />
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Add-ons available: extra users, SMS notifications, and advanced analytics packs.
        </p>
      </section>

      {/* Security */}
      <section className="bg-surface/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink">
              Security & compliance-ready foundations
            </h2>
            <p className="mt-3 text-base text-ink-muted">
              Built with tenant isolation, least-privilege roles, and traceable changes.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Shield, title: "Tenant isolation", desc: "All queries are scoped by tenant id to prevent leakage." },
              { icon: Users, title: "Role-based access", desc: "Admins and staff permissions enforced via Spring Security." },
              { icon: ClipboardList, title: "Audit logs", desc: "Track who did what, when — for accountability." },
              { icon: Lock, title: "Encrypted tokens", desc: "JWT-based auth with role + tenant claims." },
              { icon: Cloud, title: "Backups & recovery", desc: "Cloud-friendly architecture with disaster recovery options." },
              { icon: ScanLine, title: "Device readiness", desc: "Designed for scanners and high-throughput POS workflows." },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-ink/10 bg-surface p-6 shadow-card"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-accent">
                  <s.icon className="size-5" strokeWidth={1.6} />
                </div>
                <p className="mt-4 text-base font-semibold text-ink">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base text-ink-muted">
            Quick answers about onboarding, security, and daily operations.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          <AccordionItem title="Can I import existing products?">
            Yes. You can add an import flow (CSV) to load your catalog, suppliers, and starting stock.
          </AccordionItem>
          <AccordionItem title="How does multi-tenant isolation work?">
            Each pharmacy gets a tenant id. All queries are filtered by that id and enforced in services/repositories.
          </AccordionItem>
          <AccordionItem title="Do you support barcode scanners?">
            Yes. NexPharm is optimized for scanners that send an Enter key after the barcode.
          </AccordionItem>
          <AccordionItem title="Can I change my branding/logo?">
            Yes. Admins can update the pharmacy profile and logo; the UI updates immediately.
          </AccordionItem>
          <AccordionItem title="What happens if the internet is down?">
            NexPharm is cloud-first; offline mode can be added with local queueing if needed.
          </AccordionItem>
          <AccordionItem title="Is there support and training?">
            Yes. We can provide onboarding, training, and priority support depending on your plan.
          </AccordionItem>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground shadow-card">
            <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
            <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  Start managing your pharmacy the smart way.
                </h3>
                <p className="mt-2 text-sm text-primary-foreground/90">
                  Free trial • Setup in minutes • Multi-tenant SaaS built for growth
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="w-full bg-white text-ink hover:bg-white/90">
                    Get Started <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <a href="mailto:sales@nexpharm.example" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15">
                    Contact Sales
                  </Button>
                </a>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            Sales: sales@nexpharm.example • Support: support@nexpharm.example
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-surface/60 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  Rx
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Rxora</p>
                  <p className="text-xs text-ink-muted">NexPharm</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                Premium multi-tenant pharmacy operations: inventory, POS, reporting, and security.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: [
                  ["Features", "#features"],
                  ["Pricing", "#pricing"],
                  ["Security", "#contact"],
                ],
              },
              {
                title: "Company",
                links: [
                  ["About", "#home"],
                  ["Contact", "#contact"],
                  ["Careers", "#contact"],
                ],
              },
              {
                title: "Legal",
                links: [
                  ["Privacy", "#contact"],
                  ["Terms", "#contact"],
                  ["Cookies", "#contact"],
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-ink">{col.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a className="hover:text-ink" href={href}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-ink/10 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} NexPharm. All rights reserved.</p>
            <p>Built with secure multi-tenant architecture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

