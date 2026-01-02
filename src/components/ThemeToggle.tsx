"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThemeOption = "light" | "dark" | "system";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Gate rendering until mounted to avoid hydration mismatch.
  const value = mounted ? ((theme ?? "system") as ThemeOption) : "system";

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-xs font-medium text-muted-foreground">Theme</div>
      <Select
        value={value}
        onValueChange={(next) => setTheme(next as ThemeOption)}
        disabled={!mounted}
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
