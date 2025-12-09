import { getOrFetchUser } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { LanguagesStep } from "@/components/retrospective/steps/languages";

interface LanguagesPageProps {
  params: Promise<{ username: string }>;
}

export default async function LanguagesPage({ params }: LanguagesPageProps) {
  const { username } = await params;
  const user = await getOrFetchUser(username);

  if (!user) {
    notFound();
  }

  return <LanguagesStep languages={user.metrics.languages} />;
}
