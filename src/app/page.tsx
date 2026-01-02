import IracingLoginButton from "@/components/IracingLoginButton";

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

        <IracingLoginButton />

        <p className="text-xs text-muted-foreground">
          Sign in to fetch your profile and personalize recommendations.
        </p>
      </div>
    </main>
  );
}
