import { ObjectId } from "mongodb";

export interface Language {
  name: string;
  percentage: number;
}

export interface TopRepo {
  name: string;
  owner: string;
  commits: number;
  additions: number;
  deletions: number;
  url: string;
}

export interface CommitInfo {
  date: Date;
  repo: string;
  message: string;
  url: string;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface GitHubMetrics {
  totalCommits: number;
  longestStreak: number;
  contributionCalendar: ContributionWeek[];
  reposCreated: number;
  reposContributed: number;
  reposForked: number;
  languages: Language[];
  totalPRs: number;
  totalIssues: number;
  codeReviewComments: number;
  starsReceived: number;
  topRepos: TopRepo[];
  firstCommit: CommitInfo | null;
  lastCommit: CommitInfo | null;
}

export interface GitHubUser {
  _id?: ObjectId;
  username: string;
  fetchedAt: Date;
  metrics: GitHubMetrics;
}

export type GitHubUserDocument = GitHubUser & { _id: ObjectId };
