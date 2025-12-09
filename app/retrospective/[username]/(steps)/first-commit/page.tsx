import { getUserByUsername } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { FirstLastCommitStep } from "@/components/retrospective/steps/first-last-commit";

interface FirstCommitPageProps {
  params: Promise<{ username: string }>;
}

export default async function FirstCommitPage({
  params,
}: FirstCommitPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return (
    <FirstLastCommitStep
      firstCommit={user.metrics.firstCommit}
      lastCommit={user.metrics.lastCommit}
      username={user.username}
    />
  );
}
