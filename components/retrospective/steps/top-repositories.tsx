"use client";

import { motion } from "motion/react";
import { FolderGit2, GitCommit, ExternalLink } from "lucide-react";
import { DecryptedText } from "@/components/ui/decrypted-text";
import { TopRepo } from "@/lib/types/github-user";

interface TopRepositoriesStepProps {
  topRepos: TopRepo[];
}

export function TopRepositoriesStep({ topRepos }: TopRepositoriesStepProps) {
  if (topRepos.length === 0) {
    return (
      <div className="space-y-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <FolderGit2 className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">
            No repository activity found for 2025
          </p>
        </motion.div>
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
          Your most active repositories
        </p>
      </motion.div>

      <div className="space-y-4">
        {topRepos.slice(0, 5).map((repo, index) => (
          <motion.div
            key={`${repo.owner}/${repo.name}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.15 }}
          >
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <h3 className="truncate font-mono text-lg font-semibold">
                      <DecryptedText
                        text={repo.name}
                        animateOn="view"
                        sequential
                        speed={160}
                        maxIterations={60}
                        className="text-foreground"
                        encryptedClassName="text-muted-foreground"
                      />
                    </h3>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    <DecryptedText
                      text={`${repo.owner}/${repo.name}`}
                      animateOn="view"
                      sequential
                      speed={80}
                      maxIterations={30}
                      className="text-muted-foreground"
                      encryptedClassName="text-muted-foreground/50"
                    />
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GitCommit className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    {repo.commits.toLocaleString()}
                  </span>
                  <span>commits</span>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </div>

      {topRepos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + Math.min(topRepos.length, 5) * 0.15 + 0.3 }}
          className="text-center text-sm text-muted-foreground"
        >
          <p>
            Total of{" "}
            <span className="font-medium text-foreground">
              {topRepos
                .reduce((sum, repo) => sum + repo.commits, 0)
                .toLocaleString()}
            </span>{" "}
            commits across your top public repositories
          </p>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 + Math.min(topRepos.length, 5) * 0.15 + 0.5 }}
        className="text-center text-xs text-muted-foreground/70"
      >
        Based on public repository activity only
      </motion.p>
    </div>
  );
}
