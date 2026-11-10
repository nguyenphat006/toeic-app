import type { Metadata } from "next";

import { MistakesView } from "@/components/mistakes/mistakes-view";

export const metadata: Metadata = { title: "Sổ lỗi" };

export default function MistakesPage() {
  return <MistakesView />;
}
