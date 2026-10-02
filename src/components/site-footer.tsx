import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const columns = [
  {
    title: "Insurance",
    links: ["Motor", "Health", "Travel", "Home", "Business", "Cyber"],
  },
  {
    title: "Platform",
    links: ["How it works", "Compare policies", "Claims support", "Renewals", "Digital certificates"],
  },
  {
    title: "Partners",
    links: ["List your products", "Broker portal", "API & integrations", "Underwriting tools"],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">InsureHub</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              One marketplace to compare, buy, manage, and claim insurance from regulated providers.
              InsureHub is a licensed distribution platform, not an insurer.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="/browse"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} InsureHub Technologies. All rights reserved.</p>
          <p className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Regulatory disclosures</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
