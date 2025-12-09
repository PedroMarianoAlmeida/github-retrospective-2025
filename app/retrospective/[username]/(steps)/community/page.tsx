import { getOrFetchUser } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { CommunityImpactStep } from "@/components/retrospective/steps/community-impact";

interface CommunityPageProps {
  params: Promise<{ username: string }>;
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { username } = await params;
  const user = await getOrFetchUser(username);

  if (!user) {
    notFound();
  }

  return (
    <CommunityImpactStep
      totalPRs={user.metrics.totalPRs}
      totalIssues={user.metrics.totalIssues}
      starsReceived={user.metrics.starsReceived}
      codeReviewComments={user.metrics.codeReviewComments}
      reposContributed={user.metrics.reposContributed}
      reposForked={user.metrics.reposForked}
    />
  );
}
