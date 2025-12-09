"use client";

import { motion } from "motion/react";
import { Flame, Zap } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { ContributionWeek } from "@/lib/types/github-user";

interface CodingStreakStepProps {
  longestStreak: number;
  contributionCalendar: ContributionWeek[];
  username: string;
}

function getStreakMessage(streak: number): { message: string; label: string } {
  const weeks = Math.floor(streak / 7);
  const months = Math.floor(streak / 30);

  if (streak >= 100) {
    return {
      message: "Incredible dedication! You're a coding machine!",
      label: `That's over ${months} months of daily coding!`,
    };
  } else if (streak >= 50) {
    return {
      message: "Amazing consistency!",
      label: `That's ${weeks} weeks of daily coding!`,
    };
  } else if (streak >= 30) {
    return {
      message: "A whole month of daily coding! Impressive!",
      label: `That's ${weeks} weeks straight!`,
    };
  } else if (streak >= 14) {
    return {
      message: "Two weeks strong! Great momentum!",
      label: `That's ${weeks} weeks of consistency!`,
    };
  } else if (streak >= 7) {
    return {
      message: "Over a week of daily commits!",
      label: `That's ${weeks} week${weeks > 1 ? "s" : ""} and ${streak % 7} days!`,
    };
  } else if (streak >= 3) {
    return {
      message: "Building that coding habit!",
      label: "Keep pushing forward!",
    };
  } else if (streak >= 1) {
    return {
      message: "Every journey starts with a single step!",
      label: "The beginning of something great!",
    };
  }
  return {
    message: "Ready to start your streak?",
    label: "Your first commit awaits!",
  };
}

export function CodingStreakStep({
  longestStreak,
  contributionCalendar,
}: CodingStreakStepProps) {
  const { message, label } = getStreakMessage(longestStreak);

  // Handle case where calendar data doesn't exist (old cached data)
  const calendar = contributionCalendar ?? [];
  const hasCalendarData = calendar.length > 0;

  // Calculate total active days
  const totalActiveDays = calendar
    .flatMap((week) => week.contributionDays)
    .filter((day) => day.contributionCount > 0).length;

  return (
    <div className="space-y-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg text-muted-foreground">
          Your longest coding streak was
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <Flame className="h-12 w-12 text-orange-500" />
          <CountUp
            to={longestStreak}
            duration={2.5}
            delay={0.3}
            className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
          />
        </div>
        <p className="mt-4 text-2xl font-medium text-muted-foreground">
          consecutive days
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="rounded-xl border border-border bg-muted/30 p-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-500/10 p-2">
            <Zap className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="font-medium">{message}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </motion.div>

      {hasCalendarData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="rounded-xl border border-border bg-muted/30 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                You were active on {totalActiveDays} days in 2025
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                That&apos;s {Math.round((totalActiveDays / 365) * 100)}% of the
                year!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="text-center text-xs text-muted-foreground/70"
      >
        Based on public repository activity only
      </motion.p>
    </div>
  );
}
