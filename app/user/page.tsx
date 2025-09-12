"use client";

import { useSearchParams } from "next/navigation";
import { User } from "@/components/user/component";

export default function Page() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return <User code={code} />;
}
