import { getUserByUsername } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { TopRepositoriesStep } from "@/components/retrospective/steps/top-repositories";

interface TopRepositoriesPageProps {
  params: Promise<{ username: string }>;
}

export default async function TopRepositoriesPage({
  params,
}: TopRepositoriesPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return <TopRepositoriesStep topRepos={user.metrics.topRepos} />;
}
