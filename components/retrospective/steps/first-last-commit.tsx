"use client";

import { CommitInfo } from "@/lib/types/github-user";
import { motion } from "motion/react";
import { GitCommit, Calendar, ExternalLink } from "lucide-react";

interface FirstLastCommitStepProps {
  firstCommit: CommitInfo | null;
  lastCommit: CommitInfo | null;
  username: string;
}

export function FirstLastCommitStep({
  firstCommit,
  lastCommit,
  username,
}: FirstLastCommitStepProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength).trim() + "...";
  };

  if (!firstCommit) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          No commits found for {username} in 2025.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg text-muted-foreground">
          It was a long journey this year...
        </p>
        <p className="mt-2 text-xl font-medium">
          Do you remember your first commit?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-border bg-muted/30 p-6"
      >
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <GitCommit className="h-4 w-4" />
          <span>First commit of 2025</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="mt-1 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">{formatDate(firstCommit.date)}</p>
            </div>
          </div>

          <div className="rounded-lg bg-background p-4">
            <p className="font-mono text-sm">
              {truncateMessage(firstCommit.message)}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{firstCommit.repo}</span>
              {firstCommit.url && (
                <a
                  href={firstCommit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  View commit
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {lastCommit && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl border border-border bg-muted/30 p-6"
        >
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <GitCommit className="h-4 w-4" />
            <span>Most recent commit of 2025</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">{formatDate(lastCommit.date)}</p>
              </div>
            </div>

            <div className="rounded-lg bg-background p-4">
              <p className="font-mono text-sm">
                {truncateMessage(lastCommit.message)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{lastCommit.repo}</span>
                {lastCommit.url && (
                  <a
                    href={lastCommit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    View commit
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
