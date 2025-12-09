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

function isDataFresh(fetchedAt: Date): boolean {
  const now = new Date();
  const age = now.getTime() - new Date(fetchedAt).getTime();
  return age < CACHE_DURATION_MS;
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

    if (cachedUser && isDataFresh(cachedUser.fetchedAt)) {
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
