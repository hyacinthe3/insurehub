import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Landmark, ShieldCheck, UserRound } from "lucide-react";

import { AuthShell, AuthLink, GoogleButton } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Get started with InsureHub — Create your account",
  description:
    "Join InsureHub to compare, buy and manage insurance. Accounts for individuals, businesses, insurers and brokers.",
  openGraph: {
    title: "Get started with InsureHub",
    description: "Create an InsureHub account as an individual, business, insurer or broker.",
  },
};

const audiences = [
  {
    icon: UserRound,
    title: "Individual",
    blurb: "Compare motor, health, travel and life cover in minutes.",
    to: "/auth/register",
  },
  {
    icon: Building2,
    title: "Business",
    blurb: "Group health, liability and fleet cover for your team.",
    to: "/auth/register",
  },
  {
    icon: Landmark,
    title: "Insurance company",
    blurb: "List products, price in real time and track conversion.",
    to: "/auth/register",
  },
  {
    icon: ShieldCheck,
    title: "Broker",
    blurb: "Manage your book of business and client renewals.",
    to: "/auth/register",
  },
] as const;

export default function WelcomePage() {
  return (
    <AuthShell
      wide
      eyebrow="Welcome to InsureHub"
      title="One account for every kind of cover"
      subtitle="Choose how you want to use InsureHub. You can always add more profiles later."
      footer={
        <>
          Already have an account? <AuthLink to="/auth/login">Sign in</AuthLink>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {audiences.map((item) => (
          <Link
            key={item.title}
            href={item.to}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <item.icon className="h-5 w-5" />
            </span>
            <p className="mt-3.5 font-semibold">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.blurb}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <GoogleButton label="Sign up with Google" />
        <Button asChild className="w-full">
          <Link href="/auth/register">Continue with email</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
