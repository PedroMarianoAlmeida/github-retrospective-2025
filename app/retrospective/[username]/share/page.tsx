import { getOrFetchUser, getAverageStats } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { SharePageContent } from "@/components/retrospective/share-page-content";

interface SharePageProps {
  params: Promise<{ username: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { username } = await params;
  const [user, averageStats] = await Promise.all([
    getOrFetchUser(username),
    getAverageStats(),
  ]);

  if (!user) {
    notFound();
  }

  return <SharePageContent user={user} averageStats={averageStats} />;
}
