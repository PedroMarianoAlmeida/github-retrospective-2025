import { ShareStep } from "@/components/retrospective/steps/share";

interface SharePageProps {
  params: Promise<{ username: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { username } = await params;

  return <ShareStep username={username} />;
}
