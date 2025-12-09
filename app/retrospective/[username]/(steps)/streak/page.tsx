import { getOrFetchUser } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { CodingStreakStep } from "@/components/retrospective/steps/coding-streak";

interface StreakPageProps {
  params: Promise<{ username: string }>;
}

export default async function StreakPage({ params }: StreakPageProps) {
  const { username } = await params;
  const user = await getOrFetchUser(username);

  if (!user) {
    notFound();
  }

  return (
    <CodingStreakStep
      longestStreak={user.metrics.longestStreak}
      contributionCalendar={user.metrics.contributionCalendar}
      username={user.username}
    />
  );
}
