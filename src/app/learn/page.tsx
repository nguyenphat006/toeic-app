import type { Metadata } from "next";

import { SessionView } from "@/components/session/session-view";

export const metadata: Metadata = { title: "Buổi học" };

export default function LearnPage() {
  return <SessionView />;
}
