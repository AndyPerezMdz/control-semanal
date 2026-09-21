"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

export default function WeekPicker({ desde }: { desde: string }) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-xs text-[var(--ink-secondary)]">
      <CalendarDays size={14} />
      <input
        type="date"
        defaultValue={desde}
        onChange={(e) => {
          if (e.target.value) router.push(`/dashboard?desde=${e.target.value}`);
        }}
        className="bg-transparent text-xs text-[var(--ink-primary)] outline-none"
      />
    </label>
  );
}
