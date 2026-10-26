"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/matches");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
      <p className="text-xs text-muted-foreground">Redirecting to matches & conversations...</p>
    </div>
  );
}
