import type { Metadata } from "next";

import BrowseClient from "./browse-client";

export const metadata: Metadata = {
  title: "Browse insurance products — InsureHub",
  description:
    "Search and filter 640+ insurance products across 18 categories from regulated providers, with transparent premiums in RWF and cover limits.",
  openGraph: {
    title: "Browse insurance products — InsureHub",
    description: "Filter by category, provider, premium, and cover to shortlist policies in seconds.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function BrowsePage() {
  return <BrowseClient />;
}
