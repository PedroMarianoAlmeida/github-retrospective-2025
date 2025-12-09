"use server";

import { getDatabase } from "@/lib/mongodb";
import { GitHubUser, GitHubMetrics } from "@/lib/types/github-user";
import {
  fetchGitHubMetrics,
  checkUserExists,
} from "@/lib/services/github";

// Cache duration: 3 days in milliseconds
const CACHE_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

export async function getUserByUsername(
  username: string
): Promise<GitHubUser | null> {
  const db = await getDatabase();
  const collection = db.collection<GitHubUser>("gitHubUser");

  const user = await collection.findOne({ username: username.toLowerCase() });

  if (!user) {
    return null;
  }

  // Convert MongoDB document to plain object for serialization
  return {
    username: user.username,
    fetchedAt: user.fetchedAt,
    metrics: user.metrics,
  };
}

export async function upsertUser(
  username: string,
  metrics: GitHubMetrics
): Promise<GitHubUser> {
  const db = await getDatabase();
  const collection = db.collection<GitHubUser>("gitHubUser");

  const normalizedUsername = username.toLowerCase();
  const now = new Date();

  await collection.updateOne(
    { username: normalizedUsername },
    {
      $set: {
        username: normalizedUsername,
        fetchedAt: now,
        metrics,
      },
    },
    { upsert: true }
  );

  return {
    username: normalizedUsername,
    fetchedAt: now,
    metrics,
  };
}

function isDataFresh(user: GitHubUser): boolean {
  const now = new Date();
  const age = now.getTime() - new Date(user.fetchedAt).getTime();
  const notExpired = age < CACHE_DURATION_MS;

  // Also check if we have all required fields (e.g., contributionCalendar)
  const hasAllFields = user.metrics.contributionCalendar !== undefined;

  return notExpired && hasAllFields;
}

export type LookupUserResult =
  | { success: true; user: GitHubUser }
  | { success: false; error: string };

export async function getAverageCommits(): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection<GitHubUser>("gitHubUser");

  const result = await collection
    .aggregate<{ avgCommits: number }>([
      {
        $group: {
          _id: null,
          avgCommits: { $avg: "$metrics.totalCommits" },
        },
      },
    ])
    .toArray();

  // Return 0 if no users exist yet
  return result[0]?.avgCommits ?? 0;
}

export interface AverageStats {
  totalCommits: number;
  longestStreak: number;
  totalPRs: number;
  totalIssues: number;
  starsReceived: number;
  userCount: number;
}

export async function getTotalUserCount(): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection<GitHubUser>("gitHubUser");
  return collection.countDocuments();
}

export async function getAverageStats(): Promise<AverageStats> {
  const db = await getDatabase();
  const collection = db.collection<GitHubUser>("gitHubUser");

  const result = await collection
    .aggregate<{
      avgCommits: number;
      avgStreak: number;
      avgPRs: number;
      avgIssues: number;
      avgStars: number;
      count: number;
    }>([
      {
        $group: {
          _id: null,
          avgCommits: { $avg: "$metrics.totalCommits" },
          avgStreak: { $avg: "$metrics.longestStreak" },
          avgPRs: { $avg: "$metrics.totalPRs" },
          avgIssues: { $avg: "$metrics.totalIssues" },
          avgStars: { $avg: "$metrics.starsReceived" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const stats = result[0];

  return {
    totalCommits: Math.round(stats?.avgCommits ?? 0),
    longestStreak: Math.round(stats?.avgStreak ?? 0),
    totalPRs: Math.round(stats?.avgPRs ?? 0),
    totalIssues: Math.round(stats?.avgIssues ?? 0),
    starsReceived: Math.round(stats?.avgStars ?? 0),
    userCount: stats?.count ?? 0,
  };
}

/**
 * Get user from database, or fetch from GitHub if not found.
 * Use this in step pages to ensure users can access any step directly via URL.
 */
export async function getOrFetchUser(
  username: string
): Promise<GitHubUser | null> {
  const trimmedUsername = username.trim().toLowerCase();

  if (!trimmedUsername) {
    return null;
  }

  // Validate username format
  const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  if (!usernameRegex.test(trimmedUsername)) {
    return null;
  }

  // Check if we have cached data that's still fresh
  const cachedUser = await getUserByUsername(trimmedUsername);

  if (cachedUser && isDataFresh(cachedUser)) {
    return cachedUser;
  }

  try {
    // Check if user exists on GitHub
    const userExists = await checkUserExists(trimmedUsername);
    if (!userExists) {
      return null;
    }

    // Fetch fresh data from GitHub
    console.log(`Fetching fresh data for ${trimmedUsername}`);
    const metrics = await fetchGitHubMetrics(trimmedUsername);

    // Save to database
    const user = await upsertUser(trimmedUsername, metrics);

    return user;
  } catch (error) {
    console.error("Error fetching user from GitHub:", error);

    // If we have stale cached data, return it as a fallback
    if (cachedUser) {
      console.log(`Returning stale cached data for ${trimmedUsername} due to error`);
      return cachedUser;
    }

    return null;
  }
}

export async function lookupUser(username: string): Promise<LookupUserResult> {
  const trimmedUsername = username.trim().toLowerCase();

  if (!trimmedUsername) {
    return { success: false, error: "Username is required" };
  }

  // Validate username format (GitHub usernames: alphanumeric and hyphens, 1-39 chars)
  const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  if (!usernameRegex.test(trimmedUsername)) {
    return { success: false, error: "Invalid GitHub username format" };
  }

  try {
    // Check if we have cached data that's still fresh
    const cachedUser = await getUserByUsername(trimmedUsername);

    if (cachedUser && isDataFresh(cachedUser)) {
      console.log(`Using cached data for ${trimmedUsername}`);
      return { success: true, user: cachedUser };
    }

    // Check if user exists on GitHub
    const userExists = await checkUserExists(trimmedUsername);
    if (!userExists) {
      return { success: false, error: "GitHub user not found" };
    }

    // Fetch fresh data from GitHub
    console.log(`Fetching fresh data for ${trimmedUsername}`);
    const metrics = await fetchGitHubMetrics(trimmedUsername);

    // Save to database
    const user = await upsertUser(trimmedUsername, metrics);

    return { success: true, user };
  } catch (error) {
    console.error("Error looking up user:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific error types
    if (errorMessage.includes("Bad credentials") || errorMessage.includes("401")) {
      return { success: false, error: "GitHub API authentication failed. Please check GITHUB_TOKEN." };
    }

    if (errorMessage.includes("rate limit")) {
      return { success: false, error: "GitHub API rate limit exceeded. Please try again later." };
    }

    // If we have stale cached data, return it as a fallback
    const cachedUser = await getUserByUsername(trimmedUsername);
    if (cachedUser) {
      console.log(`Returning stale cached data for ${trimmedUsername} due to error`);
      return { success: true, user: cachedUser };
    }

    return { success: false, error: "Failed to fetch GitHub data. Please try again." };
  }
}
