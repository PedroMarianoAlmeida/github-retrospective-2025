import { redirect } from "next/navigation";

interface RetrospectivePageProps {
  params: Promise<{ username: string }>;
}

export default async function RetrospectivePage({
  params,
}: RetrospectivePageProps) {
  const { username } = await params;

  // Redirect to the first step
  redirect(`/retrospective/${username}/first-commit`);
}
