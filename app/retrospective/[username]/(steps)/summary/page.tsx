import { getUserByUsername, getAverageStats } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { SummaryStep } from "@/components/retrospective/steps/summary";

interface SummaryPageProps {
  params: Promise<{ username: string }>;
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { username } = await params;
  const [user, averageStats] = await Promise.all([
    getUserByUsername(username),
    getAverageStats(),
  ]);

  if (!user) {
    notFound();
  }

  return <SummaryStep user={user} averageStats={averageStats} />;
}
