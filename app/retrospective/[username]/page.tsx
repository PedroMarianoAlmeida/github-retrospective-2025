import { getUserByUsername } from "@/app/actions/user";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RetrospectivePageProps {
  params: Promise<{ username: string }>;
}

export default async function RetrospectivePage({
  params,
}: RetrospectivePageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {user.username}&apos;s 2025
          </h1>
          <p className="text-muted-foreground">
            Data fetched on{" "}
            {new Date(user.fetchedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="w-full rounded-lg border bg-card p-6 text-left">
          <h2 className="mb-4 text-xl font-semibold">Raw User Data</h2>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-sm">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <Link href="/">
          <Button variant="outline">Try Another Username</Button>
        </Link>
      </main>
    </div>
  );
}
