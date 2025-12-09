"use client";

import { motion } from "motion/react";
import {
  GitPullRequest,
  CircleDot,
  Star,
  MessageSquare,
  Users,
  GitFork,
  Heart,
} from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

interface CommunityImpactStepProps {
  totalPRs: number;
  totalIssues: number;
  starsReceived: number;
  codeReviewComments: number;
  reposContributed: number;
  reposForked: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay: number;
  iconBgColor: string;
  iconColor: string;
}

function StatCard({
  icon,
  value,
  label,
  delay,
  iconBgColor,
  iconColor,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${iconBgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <CountUp
            to={value}
            duration={2}
            delay={delay}
            className="text-2xl font-bold"
          />
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function getCommunityMessage(
  prs: number,
  issues: number,
  stars: number,
  reviews: number,
  contributed: number
): string {
  const totalActivity = prs + issues + reviews;

  if (stars >= 100) {
    return "Your projects are inspiring the community! Stars are pouring in.";
  } else if (contributed >= 10) {
    return "You're a true open source champion! Contributing across many projects.";
  } else if (prs >= 50) {
    return "PR machine! You've been shipping code left and right.";
  } else if (reviews >= 50) {
    return "Code review expert! Helping others write better code.";
  } else if (totalActivity >= 100) {
    return "Highly engaged community member! You're making waves.";
  } else if (totalActivity >= 50) {
    return "Active contributor! The community appreciates your involvement.";
  } else if (totalActivity >= 20) {
    return "Building your presence! Every contribution counts.";
  } else if (totalActivity >= 1) {
    return "Getting involved! Great start to community engagement.";
  }
  return "Ready to make an impact! Your first contribution awaits.";
}

export function CommunityImpactStep({
  totalPRs,
  totalIssues,
  starsReceived,
  codeReviewComments,
  reposContributed,
  reposForked,
}: CommunityImpactStepProps) {
  const communityMessage = getCommunityMessage(
    totalPRs,
    totalIssues,
    starsReceived,
    codeReviewComments,
    reposContributed
  );

  const hasActivity =
    totalPRs > 0 ||
    totalIssues > 0 ||
    starsReceived > 0 ||
    codeReviewComments > 0 ||
    reposContributed > 0 ||
    reposForked > 0;

  return (
    <div className="space-y-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg text-muted-foreground">
          Your community impact in 2025
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <Heart className="h-12 w-12 text-pink-500" />
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Community Builder
        </h2>
      </motion.div>

      {hasActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl border border-border bg-muted/30 p-6"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-pink-500/10 p-2">
              <Users className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="font-medium">{communityMessage}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every interaction strengthens the developer community
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<GitPullRequest className="h-5 w-5" />}
          value={totalPRs}
          label="Pull Requests"
          delay={1.0}
          iconBgColor="bg-green-500/10"
          iconColor="text-green-500"
        />
        <StatCard
          icon={<CircleDot className="h-5 w-5" />}
          value={totalIssues}
          label="Issues"
          delay={1.1}
          iconBgColor="bg-purple-500/10"
          iconColor="text-purple-500"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          value={starsReceived}
          label="Stars Received"
          delay={1.2}
          iconBgColor="bg-yellow-500/10"
          iconColor="text-yellow-500"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          value={codeReviewComments}
          label="Review Comments"
          delay={1.3}
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          value={reposContributed}
          label="Repos Contributed"
          delay={1.4}
          iconBgColor="bg-orange-500/10"
          iconColor="text-orange-500"
        />
        <StatCard
          icon={<GitFork className="h-5 w-5" />}
          value={reposForked}
          label="Repos Forked"
          delay={1.5}
          iconBgColor="bg-cyan-500/10"
          iconColor="text-cyan-500"
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-center text-xs text-muted-foreground/70"
      >
        Based on public repository activity only
      </motion.p>
    </div>
  );
}
