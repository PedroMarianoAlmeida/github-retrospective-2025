"use client";

import { usePathname, useRouter } from "next/navigation";
import { StepperNavigation } from "./stepper-navigation";

interface StepsLayoutProps {
  children: React.ReactNode;
  username: string;
}

// Define all steps with their routes
export const STEPS = [
  { slug: "first-commit", label: "First Commit" },
  { slug: "total-commits", label: "Total Commits" },
  { slug: "top-repositories", label: "Top Repositories" },
  { slug: "streak", label: "Coding Streak" },
  { slug: "languages", label: "Languages" },
  { slug: "community", label: "Community Impact" },
  { slug: "summary", label: "Summary" },
] as const;

export type StepSlug = (typeof STEPS)[number]["slug"];

export function StepsLayout({ children, username }: StepsLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Get current step index from pathname
  const currentSlug = pathname.split("/").pop() as StepSlug;
  const currentStepIndex = STEPS.findIndex((step) => step.slug === currentSlug);
  const currentStep = currentStepIndex === -1 ? 1 : currentStepIndex + 1;

  const handleStepChange = (step: number) => {
    const targetStep = STEPS[step - 1];
    if (targetStep) {
      router.push(`/retrospective/${username}/${targetStep.slug}`);
    }
  };

  const handleComplete = () => {
    // Navigate to share page after completion
    router.push(`/retrospective/${username}/share`);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {username}&apos;s 2025
        </h1>
        <p className="mt-2 text-muted-foreground">Your year in code</p>
      </div>

      <StepperNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onStepChange={handleStepChange}
        onComplete={handleComplete}
      >
        {children}
      </StepperNavigation>
    </div>
  );
}
