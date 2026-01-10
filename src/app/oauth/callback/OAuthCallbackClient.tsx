"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    return {
      code: searchParams.get("code"),
      state: searchParams.get("state"),
      error: searchParams.get("error"),
      errorDescription: searchParams.get("error_description"),
    };
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function exchange() {
      if (query.error) {
        const description = query.errorDescription
          ? `: ${query.errorDescription}`
          : "";
        setError(`${query.error}${description}`);
        setLoading(false);
        return;
      }

      if (!query.code || !query.state) {
        setError("Missing code or state in callback URL.");
        setLoading(false);
        return;
      }

      try {
        const resp = await fetch("/api/auth/exchange", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: query.code, state: query.state }),
        });
        const data = await resp.json().catch(() => ({}));

        if (!resp.ok || !data?.ok) {
          const message =
            data?.error || "We couldn't complete sign-in. Please try again.";
          if (!cancelled) {
            setError(message);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          router.replace("/?auth=success");
        }
      } catch {
        if (!cancelled) {
          setError("We couldn't complete sign-in. Please try again.");
          setLoading(false);
        }
      }
    }

    exchange();
    return () => {
      cancelled = true;
    };
  }, [query, router]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Signing you in...</h1>
      {loading && (
        <p className="text-sm text-muted-foreground">
          Finishing the iRacing handshake.
        </p>
      )}
      {!loading && error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}