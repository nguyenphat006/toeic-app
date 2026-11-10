import type { Metadata } from "next";

import { VocabView } from "@/components/vocab/vocab-view";

export const metadata: Metadata = { title: "Từ vựng" };

export default function VocabPage() {
  return <VocabView />;
}
