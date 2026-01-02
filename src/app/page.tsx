import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Should I Race This?
        </h1>

        <p className="max-w-xl text-muted-foreground">
          Data-backed race recommendations to help you gain iRating while managing
          Safety Rating risk.
        </p>

        <Button asChild className="h-12 px-6">
          <Link href="/dashboard">Open Dashboard (Mock)</Link>
        </Button>

        <p className="text-xs text-muted-foreground">
          (We’ll wire OAuth login back in once Redirect URIs are corrected.)
        </p>
      </div>
    </main>
  );
}
