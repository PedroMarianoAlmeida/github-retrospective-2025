"use client";

import { motion } from "motion/react";
import { GitCommit, TrendingUp, Users } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

interface TotalCommitsStepProps {
  totalCommits: number;
  username: string;
  averageCommits: number;
}

function getCommitComparison(
  commits: number,
  average: number
): {
  message: string;
  percentile: string;
} | null {
  if (average === 0) return null;

  const ratio = commits / average;

  if (ratio >= 4) {
    return {
      message: "You're in the top 1% of active developers!",
      percentile: "top 1%",
    };
  } else if (ratio >= 2) {
    return {
      message: "You're more active than 90% of developers!",
      percentile: "top 10%",
    };
  } else if (ratio >= 1.5) {
    return {
      message: "You're more active than 75% of developers!",
      percentile: "top 25%",
    };
  } else if (ratio >= 1) {
    return {
      message: "You're right on track with active developers!",
      percentile: "top 50%",
    };
  } else if (ratio >= 0.5) {
    return {
      message: "You've been steadily contributing this year.",
      percentile: "active",
    };
  } else {
    return {
      message: "Every commit counts! Keep pushing forward.",
      percentile: "growing",
    };
  }
}

export function TotalCommitsStep({
  totalCommits,
  username,
  averageCommits,
}: TotalCommitsStepProps) {
  const comparison = getCommitComparison(totalCommits, averageCommits);

  return (
    <div className="space-y-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg text-muted-foreground">Since then, you made</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <GitCommit className="h-12 w-12 text-primary" />
          <CountUp
            to={totalCommits}
            duration={2.5}
            delay={0.3}
            className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
          />
        </div>
        <p className="mt-4 text-2xl font-medium text-muted-foreground">
          commits in 2025
        </p>
      </motion.div>

      {comparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="rounded-xl border border-border bg-muted/30 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{comparison.message}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  Compared to ~{averageCommits.toLocaleString()} commits/year
                  average
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {totalCommits > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center text-sm text-muted-foreground"
        >
          <p>
            That&apos;s about{" "}
            <span className="font-medium text-foreground">
              {Math.round(totalCommits / 12)}
            </span>{" "}
            commits per month
            {totalCommits >= 365 && (
              <>
                {" "}
                or{" "}
                <span className="font-medium text-foreground">
                  {(totalCommits / 365).toFixed(1)}
                </span>{" "}
                commits per day
              </>
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
}
