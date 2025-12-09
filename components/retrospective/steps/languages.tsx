"use client";

import { motion } from "motion/react";
import { Code2, Trophy, Sparkles } from "lucide-react";
import { Language } from "@/lib/types/github-user";

interface LanguagesStepProps {
  languages: Language[];
}

// Language colors inspired by GitHub's linguist
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Scala: "#c22d40",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Dart: "#00B4AB",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Lua: "#000080",
  R: "#198CE7",
  Julia: "#a270ba",
  Perl: "#0298c3",
  Objective: "#438eff",
  Assembly: "#6E4C13",
  MATLAB: "#e16737",
  Clojure: "#db5855",
  Erlang: "#B83998",
  F: "#b845fc",
  OCaml: "#3be133",
  Nim: "#ffc200",
  Zig: "#ec915c",
  Solidity: "#AA6746",
  Move: "#4a137a",
  MDX: "#fcb32c",
  Astro: "#ff5a03",
};

function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || "#6e7681";
}

function getLanguageEmoji(language: string): string {
  const emojiMap: Record<string, string> = {
    JavaScript: "JS",
    TypeScript: "TS",
    Python: "PY",
    Java: "JV",
    Rust: "RS",
    Go: "GO",
    Ruby: "RB",
    PHP: "PHP",
    Swift: "SW",
    Kotlin: "KT",
  };
  return emojiMap[language] || language.slice(0, 2).toUpperCase();
}

function getTopLanguageMessage(language: string): string {
  const messages: Record<string, string> = {
    JavaScript: "The language of the web! You're building interactive experiences.",
    TypeScript: "Type safety is your superpower! Clean, scalable code.",
    Python: "Simple and powerful! Perfect for anything from AI to automation.",
    Java: "Enterprise-grade engineering! Building robust systems.",
    Rust: "Memory safety without garbage collection! Performance champion.",
    Go: "Concurrency made easy! Building scalable backends.",
    Ruby: "Developer happiness! Elegant and expressive code.",
    PHP: "Powering the web since 1995! Keeping the internet running.",
    Swift: "Apple ecosystem mastery! Building beautiful apps.",
    Kotlin: "Modern JVM development! Android and beyond.",
    "C++": "Close to the metal! Maximum performance achieved.",
    C: "The foundation of computing! Low-level excellence.",
    "C#": ".NET expertise! Building across platforms.",
    Shell: "Automation wizard! Scripting your way to productivity.",
    HTML: "Structuring the web! The backbone of every page.",
    CSS: "Making the web beautiful! Design meets code.",
  };
  return messages[language] || `${language} developer! Building amazing things.`;
}

function processLanguages(languages: Language[]): Language[] {
  const significantLanguages: Language[] = [];
  let otherPercentage = 0;

  for (const lang of languages) {
    if (lang.percentage >= 1) {
      significantLanguages.push(lang);
    } else {
      otherPercentage += lang.percentage;
    }
  }

  if (otherPercentage > 0) {
    significantLanguages.push({
      name: "Other",
      percentage: otherPercentage,
    });
  }

  return significantLanguages;
}

export function LanguagesStep({ languages }: LanguagesStepProps) {
  if (!languages || languages.length === 0) {
    return (
      <div className="space-y-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Code2 className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">
            No language data available for 2025 yet.
          </p>
        </motion.div>
      </div>
    );
  }

  const processedLanguages = processLanguages(languages);
  const topLanguage = processedLanguages[0];
  const otherLanguages = processedLanguages.slice(1);

  return (
    <div className="space-y-8 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg text-muted-foreground">
          Your most used language was
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold text-white shadow-lg"
            style={{ backgroundColor: getLanguageColor(topLanguage.name) }}
          >
            {getLanguageEmoji(topLanguage.name)}
          </div>
          <div className="text-left">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {topLanguage.name}
            </h2>
            <p className="mt-1 text-xl text-muted-foreground">
              {topLanguage.percentage.toFixed(1)}% of your code
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="rounded-xl border border-border bg-muted/30 p-6"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{getTopLanguageMessage(topLanguage.name)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your go-to language for building projects this year
            </p>
          </div>
        </div>
      </motion.div>

      {otherLanguages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>You also worked with</span>
          </div>

          <div className="space-y-3">
            {otherLanguages.map((lang, index) => (
              <motion.div
                key={lang.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 + index * 0.1 }}
                className="group"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getLanguageColor(lang.name) }}
                    />
                    <span className="font-medium">{lang.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {lang.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lang.percentage}%` }}
                    transition={{ delay: 1.7 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: getLanguageColor(lang.name) }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
