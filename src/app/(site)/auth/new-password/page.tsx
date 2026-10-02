import type { Metadata } from "next";
import { Suspense } from "react";

import NewPasswordClient from "./new-password-client";

export const metadata: Metadata = {
  title: "Create a new password | InsureHub",
  description: "Choose a new password for your InsureHub account.",
  robots: { index: false },
};

export default function NewPasswordPage() {
  return (
    <Suspense>
      <NewPasswordClient />
    </Suspense>
  );
}
