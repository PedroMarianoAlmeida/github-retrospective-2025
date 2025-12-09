"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Share2, Star, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ShareStepProps {
  username: string;
}

export function ShareStep({ username }: ShareStepProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/retrospective/${username}/summary`
      : "";
  const repoUrl =
    "https://github.com/PedroMarianoAlmeida/github-retrospective-2025";

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
        <Share2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Share Your Journey
        </h2>
        <p className="mt-2 text-muted-foreground">
          Let others see your 2025 GitHub retrospective
        </p>
      </motion.div>

      {/* Share Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <p className="text-sm font-medium text-muted-foreground text-center">
          Your retrospective link
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
          <code className="flex-1 truncate text-sm">{shareUrl}</code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="shrink-0 gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-4 pt-4"
      >
        <p className="text-sm text-muted-foreground">
          Enjoyed this? Support the project!
        </p>
        <Button asChild variant="default" size="lg" className="gap-2">
          <a href={repoUrl} target="_blank" rel="noopener noreferrer">
            <Star className="h-5 w-5" />
            Star on GitHub
          </a>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <Link href="/">
            <RotateCcw className="h-4 w-4" />
            Try another username
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
