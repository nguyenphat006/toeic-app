import type { Metadata } from "next";

import { ProgressView } from "@/components/progress/progress-view";

export const metadata: Metadata = { title: "Tiến độ" };

export default function ProgressPage() {
  return <ProgressView />;
}
