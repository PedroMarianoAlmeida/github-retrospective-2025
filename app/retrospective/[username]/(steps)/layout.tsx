import { StepsLayout } from "@/components/retrospective/steps-layout";

interface StepsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export default async function Layout({ children, params }: StepsLayoutProps) {
  const { username } = await params;

  return <StepsLayout username={username}>{children}</StepsLayout>;
}
