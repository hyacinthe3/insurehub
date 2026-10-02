import type { Metadata } from "next";

import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Sign in to InsureHub",
  description: "Sign in to your InsureHub account to manage policies, quotes and claims.",
  openGraph: {
    title: "Sign in to InsureHub",
    description: "Secure sign-in for InsureHub customers, insurers and brokers.",
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
