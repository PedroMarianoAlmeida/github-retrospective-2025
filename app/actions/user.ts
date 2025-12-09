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
