"use server";

import { getDatabase } from "@/lib/mongodb";
import { GitHubUser } from "@/lib/types/github-user";

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

export type LookupUserResult =
  | { success: true; user: GitHubUser }
  | { success: false; error: string };

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
    const user = await getUserByUsername(trimmedUsername);

    if (user) {
      return { success: true, user };
    }

    // For now, return not found - in Step 4, we'll fetch from GitHub API
    return {
      success: false,
      error: "User not found. We'll fetch data from GitHub in a future update.",
    };
  } catch (error) {
    console.error("Error looking up user:", error);
    return { success: false, error: "Failed to look up user" };
  }
}
