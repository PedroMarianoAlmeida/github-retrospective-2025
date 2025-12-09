import { getUserByUsername, getAverageCommits } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { TotalCommitsStep } from "@/components/retrospective/steps/total-commits";

interface TotalCommitsPageProps {
  params: Promise<{ username: string }>;
}

export default async function TotalCommitsPage({
  params,
}: TotalCommitsPageProps) {
  const { username } = await params;
  const [user, averageCommits] = await Promise.all([
    getUserByUsername(username),
    getAverageCommits(),
  ]);

  if (!user) {
    notFound();
  }

  const totalRepos =
    user.metrics.reposCreated +
    user.metrics.reposContributed +
    user.metrics.reposForked;

  return (
    <TotalCommitsStep
      totalCommits={user.metrics.totalCommits}
      totalRepos={totalRepos}
      username={user.username}
      averageCommits={Math.round(averageCommits)}
    />
  );
}
