"use client";

import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState icon={<TriangleAlert className="size-7" aria-hidden />} title="Có lỗi xảy ra">
      <p>Tiến độ của bạn vẫn còn nguyên. Thử tải lại màn này.</p>
      <Button className="mt-4" size="md" onClick={reset}>
        Thử lại
      </Button>
    </EmptyState>
  );
}
