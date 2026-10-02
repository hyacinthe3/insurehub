import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export type DashboardStat = { label: string; value: string; delta?: string };
export type DashboardItem = { title: string; meta: string; status: string };

export function DashboardShell({
  role,
  name,
  icon: Icon,
  stats,
  items,
  itemsTitle,
  actions,
}: {
  role: string;
  name: string;
  icon: LucideIcon;
  stats: DashboardStat[];
  items: DashboardItem[];
  itemsTitle: string;
  actions: { label: string; to: string }[];
}) {
  return (
    <section className="px-5 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {role}
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.to}
                className="inline-flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {action.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="surface p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight">{stat.value}</p>
              {stat.delta && (
                <p className="mt-1 text-xs font-medium text-success">{stat.delta}</p>
              )}
            </div>
          ))}
        </div>

        <div className="surface mt-6 overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">{itemsTitle}</h2>
          </div>
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.title}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.meta}</p>
                </div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
