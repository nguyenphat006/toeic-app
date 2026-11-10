import { Compass } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <EmptyState icon={<Compass className="size-7" aria-hidden />} title="Không tìm thấy trang này">
      <Link href="/" className="mt-3 inline-flex font-bold text-brand underline underline-offset-4">
        Về trang Hôm nay
      </Link>
    </EmptyState>
  );
}
