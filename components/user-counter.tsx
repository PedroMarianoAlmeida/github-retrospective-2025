"use client";

import { CountUp } from "@/components/ui/count-up";
import { Users } from "lucide-react";

interface UserCounterProps {
  count: number;
}

export function UserCounter({ count }: UserCounterProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4" />
      <span>Used by</span>
      <CountUp
        to={count}
        duration={2}
        className="font-semibold text-foreground"
      />
      <span>{count === 1 ? "developer" : "developers"}</span>
    </div>
  );
}
