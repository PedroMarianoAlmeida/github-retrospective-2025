import { getUserByUsername } from "@/app/actions/user";
import { notFound } from "next/navigation";
import { StepsLayout } from "@/components/retrospective/steps-layout";

interface StepsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export default async function Layout({ children, params }: StepsLayoutProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return <StepsLayout user={user}>{children}</StepsLayout>;
}
