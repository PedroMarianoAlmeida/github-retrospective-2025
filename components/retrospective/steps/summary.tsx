"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  GitCommit,
  Flame,
  GitPullRequest,
  CircleDot,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Share2,
  Github,
  RotateCcw,
  Check,
} from "lucide-react";
import { GitHubUser } from "@/lib/types/github-user";
import { AverageStats } from "@/app/actions/user";
import { CountUp } from "@/components/ui/count-up";

interface SummaryStepProps {
  user: GitHubUser;
  averageStats: AverageStats;
}

const GITHUB_REPO_URL = "https://github.com/PedroMarianoAlmeida/github-retrospective-2025";

interface ComparisonStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  average: number;
  delay: number;
  iconColor: string;
}

function getComparisonIcon(value: number, average: number) {
  if (average === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const ratio = value / average;
  if (ratio > 1.1) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (ratio < 0.9) return <TrendingDown className="h-4 w-4 text-orange-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function getComparisonText(value: number, average: number): string {
  if (average === 0) return "No comparison data";
  const ratio = value / average;
  const percentage = Math.abs(Math.round((ratio - 1) * 100));

  if (ratio > 1.1) return `${percentage}% above average`;
  if (ratio < 0.9) return `${percentage}% below average`;
  return "Right at average";
}

function ComparisonStat({
  icon,
  label,
  value,
  average,
  delay,
  iconColor,
}: ComparisonStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
    >
      <div className="flex items-center gap-3">
        <div className={iconColor}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <CountUp
              to={value}
              duration={1.5}
              delay={delay}
              className="text-xl font-bold"
            />
            <span className="text-xs text-muted-foreground">
              vs {average} avg
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs">
        {getComparisonIcon(value, average)}
        <span className="hidden sm:inline text-muted-foreground">
          {getComparisonText(value, average)}
        </span>
      </div>
    </motion.div>
  );
}

function getYearSummary(user: GitHubUser): { title: string; message: string } {
  const { metrics } = user;
  const score =
    metrics.totalCommits * 1 +
    metrics.totalPRs * 5 +
    metrics.totalIssues * 3 +
    metrics.starsReceived * 10 +
    metrics.longestStreak * 2;

  if (score >= 5000) {
    return {
      title: "Legendary Year!",
      message:
        "You've had an extraordinary year of coding. Your contributions have made a real impact!",
    };
  } else if (score >= 2000) {
    return {
      title: "Outstanding Year!",
      message:
        "Incredible dedication to your craft. You've accomplished so much this year!",
    };
  } else if (score >= 1000) {
    return {
      title: "Great Year!",
      message:
        "You've been consistently contributing and growing as a developer. Well done!",
    };
  } else if (score >= 500) {
    return {
      title: "Solid Year!",
      message:
        "You've made meaningful progress this year. Keep building on this momentum!",
    };
  } else if (score >= 100) {
    return {
      title: "Growing Year!",
      message:
        "You've taken steps forward in your coding journey. Every commit counts!",
    };
  }
  return {
    title: "New Beginnings!",
    message:
      "This year marks the start of your coding journey. The best is yet to come!",
  };
}

export function SummaryStep({ user, averageStats }: SummaryStepProps) {
  const { title, message } = getYearSummary(user);
  const { metrics } = user;
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/retrospective/${user.username}/share`
    : `/retrospective/${user.username}/share`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg text-muted-foreground">That&apos;s a wrap!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
        className="text-center"
      >
        <Award className="mx-auto h-16 w-16 text-yellow-500" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-muted-foreground">{message}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-3"
      >
        <p className="text-sm font-medium text-muted-foreground">
          Your stats vs. community average
        </p>

        <ComparisonStat
          icon={<GitCommit className="h-5 w-5" />}
          label="Commits"
          value={metrics.totalCommits}
          average={averageStats.totalCommits}
          delay={1.0}
          iconColor="text-primary"
        />

        <ComparisonStat
          icon={<Flame className="h-5 w-5" />}
          label="Longest Streak"
          value={metrics.longestStreak}
          average={averageStats.longestStreak}
          delay={1.1}
          iconColor="text-orange-500"
        />

        <ComparisonStat
          icon={<GitPullRequest className="h-5 w-5" />}
          label="Pull Requests"
          value={metrics.totalPRs}
          average={averageStats.totalPRs}
          delay={1.2}
          iconColor="text-green-500"
        />

        <ComparisonStat
          icon={<CircleDot className="h-5 w-5" />}
          label="Issues"
          value={metrics.totalIssues}
          average={averageStats.totalIssues}
          delay={1.3}
          iconColor="text-purple-500"
        />

        <ComparisonStat
          icon={<Star className="h-5 w-5" />}
          label="Stars Received"
          value={metrics.starsReceived}
          average={averageStats.starsReceived}
          delay={1.4}
          iconColor="text-yellow-500"
        />
      </motion.div>

      {averageStats.userCount > 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="text-center text-xs text-muted-foreground/70"
        >
          Compared with {averageStats.userCount} developers who used this app
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="flex flex-col gap-3 pt-4"
      >
        <button
          onClick={handleCopyLink}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium transition-colors hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5 text-green-500" />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 className="h-5 w-5" />
              Share Your Results
            </>
          )}
        </button>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium transition-colors hover:bg-muted"
        >
          <Github className="h-5 w-5" />
          Star on GitHub
        </a>

        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-medium transition-colors hover:bg-muted"
        >
          <RotateCcw className="h-5 w-5" />
          Start Again
        </Link>
      </motion.div>
    </div>
  );
}
