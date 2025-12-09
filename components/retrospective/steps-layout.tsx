"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GitHubUser } from "@/lib/types/github-user";
import { StepperNavigation } from "./stepper-navigation";

interface StepsLayoutProps {
  children: React.ReactNode;
  user: GitHubUser;
}

const STORAGE_KEY = "github-retrospective-user";

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

export function StepsLayout({ children, user }: StepsLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Store user data in localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  // Get current step index from pathname
  const currentSlug = pathname.split("/").pop() as StepSlug;
  const currentStepIndex = STEPS.findIndex((step) => step.slug === currentSlug);
  const currentStep = currentStepIndex === -1 ? 1 : currentStepIndex + 1;

  const handleStepChange = (step: number) => {
    const targetStep = STEPS[step - 1];
    if (targetStep) {
      router.push(`/retrospective/${user.username}/${targetStep.slug}`);
    }
  };

  const handleComplete = () => {
    // Navigate to home after completion
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {user.username}&apos;s 2025
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

export function getStoredUser(): GitHubUser | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as GitHubUser;
  } catch {
    return null;
  }
}
