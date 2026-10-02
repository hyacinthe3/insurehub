import type { Metadata } from "next";

import RegisterClient from "./register-client";

export const metadata: Metadata = {
  title: "Create your InsureHub account",
  description: "Join InsureHub to compare insurance products, get quotes and manage policies.",
  openGraph: {
    title: "Create your InsureHub account",
    description: "Join InsureHub in under a minute.",
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
