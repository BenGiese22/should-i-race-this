import { Suspense } from "react";
import OAuthCallbackClient from "./OAuthCallbackClient";

export default function OAuthCallbackPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
            <h1 className="text-2xl font-semibold tracking-tight">
              Signing you in...
            </h1>
            <p className="text-sm text-muted-foreground">
              Preparing the callback...
            </p>
          </div>
        }
      >
        <OAuthCallbackClient />
      </Suspense>
    </main>
  );
}