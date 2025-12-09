import { graphql } from "@octokit/graphql";
import {
  GitHubMetrics,
  Language,
  TopRepo,
  CommitInfo,
} from "@/lib/types/github-user";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is not set. GitHub API calls will fail.");
}

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});

// Year boundaries for 2025
const YEAR_START = "2025-01-01T00:00:00Z";
const YEAR_END = "2025-12-31T23:59:59Z";

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface Repository {
  name: string;
  owner: { login: string };
  url: string;
  isFork: boolean;
  stargazerCount: number;
  languages: {
    edges: Array<{
      size: number;
      node: { name: string };
    }>;
  };
}

interface CommitNode {
  committedDate: string;
  message: string;
  url: string;
  repository: {
    name: string;
    owner: { login: string };
  };
}

interface GitHubGraphQLResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalPullRequestReviewContributions: number;
      contributionCalendar: {
        weeks: ContributionWeek[];
      };
      commitContributionsByRepository: Array<{
        contributions: { totalCount: number };
        repository: Repository;
      }>;
    };
    repositories: {
      totalCount: number;
      nodes: Repository[];
    };
    repositoriesContributedTo: {
      totalCount: number;
    };
    pullRequests: {
      totalCount: number;
    };
    issues: {
      totalCount: number;
    };
  };
  rateLimit: {
    limit: number;
    cost: number;
    remaining: number;
    resetAt: string;
  };
}

interface CommitsQueryResponse {
  user: {
    contributionsCollection: {
      commitContributionsByRepository: Array<{
        repository: {
          name: string;
          owner: { login: string };
          defaultBranchRef: {
            target: {
              history: {
                nodes: CommitNode[];
              };
            };
          } | null;
        };
      }>;
    };
  };
}

const USER_STATS_QUERY = `
  query UserStats($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          contributions {
            totalCount
          }
          repository {
            name
            owner { login }
            url
            isFork
            stargazerCount
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node { name }
              }
            }
          }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: CREATED_AT, direction: DESC}) {
        totalCount
        nodes {
          name
          owner { login }
          url
          isFork
          stargazerCount
          createdAt
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node { name }
            }
          }
        }
      }
      repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, PULL_REQUEST]) {
        totalCount
      }
      pullRequests(first: 1) {
        totalCount
      }
      issues(first: 1) {
        totalCount
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;

const COMMITS_QUERY = `
  query UserCommits($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            owner { login }
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100, since: $from, until: $to, author: {id: null}) {
                    nodes {
                      committedDate
                      message
                      url
                      repository {
                        name
                        owner { login }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function calculateLongestStreak(weeks: ContributionWeek[]): number {
  const allDays = weeks.flatMap((week) => week.contributionDays);
  let longestStreak = 0;
  let currentStreak = 0;

  for (const day of allDays) {
    if (day.contributionCount > 0) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return longestStreak;
}

function aggregateLanguages(
  repositories: Array<{
    repository: Repository;
    contributions: { totalCount: number };
  }>
): Language[] {
  const languageBytes: Map<string, number> = new Map();

  for (const { repository } of repositories) {
    for (const edge of repository.languages.edges) {
      const current = languageBytes.get(edge.node.name) || 0;
      languageBytes.set(edge.node.name, current + edge.size);
    }
  }

  const totalBytes = Array.from(languageBytes.values()).reduce(
    (a, b) => a + b,
    0
  );

  if (totalBytes === 0) return [];

  const languages = Array.from(languageBytes.entries())
    .map(([name, bytes]) => ({
      name,
      percentage: Math.round((bytes / totalBytes) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);

  return languages;
}

function getTopRepos(
  contributions: Array<{
    repository: Repository;
    contributions: { totalCount: number };
  }>
): TopRepo[] {
  return contributions
    .sort((a, b) => b.contributions.totalCount - a.contributions.totalCount)
    .slice(0, 5)
    .map(({ repository, contributions: contrib }) => ({
      name: repository.name,
      owner: repository.owner.login,
      commits: contrib.totalCount,
      additions: 0,
      deletions: 0,
      url: repository.url,
    }));
}

function countReposCreatedIn2025(repos: Repository[]): number {
  return repos.filter((repo) => {
    const createdAt = (repo as Repository & { createdAt?: string }).createdAt;
    if (!createdAt) return false;
    const year = new Date(createdAt).getFullYear();
    return year === 2025 && !repo.isFork;
  }).length;
}

function countForkedRepos(repos: Repository[]): number {
  return repos.filter((repo) => repo.isFork).length;
}

function calculateStarsReceived(repos: Repository[]): number {
  return repos.reduce((total, repo) => total + repo.stargazerCount, 0);
}

async function fetchFirstAndLastCommits(
  username: string
): Promise<{ first: CommitInfo | null; last: CommitInfo | null }> {
  try {
    const response = await graphqlWithAuth<CommitsQueryResponse>(
      COMMITS_QUERY,
      {
        username,
        from: YEAR_START,
        to: YEAR_END,
      }
    );

    const allCommits: CommitNode[] = [];

    for (const repo of response.user.contributionsCollection
      .commitContributionsByRepository) {
      if (repo.repository.defaultBranchRef?.target?.history?.nodes) {
        allCommits.push(...repo.repository.defaultBranchRef.target.history.nodes);
      }
    }

    if (allCommits.length === 0) {
      return { first: null, last: null };
    }

    // Sort by date
    allCommits.sort(
      (a, b) =>
        new Date(a.committedDate).getTime() -
        new Date(b.committedDate).getTime()
    );

    const firstCommit = allCommits[0];
    const lastCommit = allCommits[allCommits.length - 1];

    return {
      first: {
        date: new Date(firstCommit.committedDate),
        repo: `${firstCommit.repository.owner.login}/${firstCommit.repository.name}`,
        message: firstCommit.message.split("\n")[0],
        url: firstCommit.url,
      },
      last: {
        date: new Date(lastCommit.committedDate),
        repo: `${lastCommit.repository.owner.login}/${lastCommit.repository.name}`,
        message: lastCommit.message.split("\n")[0],
        url: lastCommit.url,
      },
    };
  } catch (error) {
    console.error("Error fetching commits:", error);
    return { first: null, last: null };
  }
}

export async function fetchGitHubMetrics(
  username: string
): Promise<GitHubMetrics> {
  const response = await graphqlWithAuth<GitHubGraphQLResponse>(
    USER_STATS_QUERY,
    {
      username,
      from: YEAR_START,
      to: YEAR_END,
    }
  );

  const { user, rateLimit } = response;

  console.log(
    `GitHub API rate limit: ${rateLimit.remaining}/${rateLimit.limit} (cost: ${rateLimit.cost})`
  );

  if (rateLimit.remaining < 100) {
    console.warn(
      `Low rate limit! Resets at ${new Date(rateLimit.resetAt).toISOString()}`
    );
  }

  const contributions = user.contributionsCollection;
  const commitsByRepo = contributions.commitContributionsByRepository;

  // Fetch first and last commits
  const { first: firstCommit, last: lastCommit } =
    await fetchFirstAndLastCommits(username);

  const metrics: GitHubMetrics = {
    totalCommits: contributions.totalCommitContributions,
    longestStreak: calculateLongestStreak(
      contributions.contributionCalendar.weeks
    ),
    reposCreated: countReposCreatedIn2025(user.repositories.nodes),
    reposContributed: user.repositoriesContributedTo.totalCount,
    reposForked: countForkedRepos(user.repositories.nodes),
    languages: aggregateLanguages(commitsByRepo),
    totalPRs: contributions.totalPullRequestContributions,
    totalIssues: contributions.totalIssueContributions,
    codeReviewComments: contributions.totalPullRequestReviewContributions,
    starsReceived: calculateStarsReceived(user.repositories.nodes),
    topRepos: getTopRepos(commitsByRepo),
    firstCommit,
    lastCommit,
  };

  return metrics;
}

export async function checkUserExists(username: string): Promise<boolean> {
  try {
    await graphqlWithAuth(
      `
      query CheckUser($username: String!) {
        user(login: $username) {
          login
        }
      }
    `,
      { username }
    );
    return true;
  } catch (error) {
    // Check if it's a "user not found" error vs an auth/network error
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Could not resolve to a User")) {
      // User genuinely doesn't exist
      return false;
    }

    // For other errors (auth, network), log and rethrow
    console.error("Error checking user existence:", errorMessage);
    throw error;
  }
}
