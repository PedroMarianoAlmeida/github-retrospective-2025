# GitHub GraphQL API Cookbook

A practical guide to using GitHub's GraphQL API with TypeScript, based on real-world patterns.

## Setup

### 1. Install Dependencies

```bash
npm install graphql graphql-request
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-graphql-request
```

### 2. Download GitHub's GraphQL Schema

Download the schema from GitHub's API explorer or use the introspection query:

```bash
# Option 1: Download from GitHub docs
# https://docs.github.com/en/graphql/overview/public-schema

# Option 2: Use graphql-codegen introspection (requires token)
npx graphql-codegen init
```

Save the schema to `src/graphql/github.graphql`.

### 3. Configure GraphQL Codegen

Create `codegen.ts` in your project root:

```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src/graphql/github.graphql",
  documents: ["src/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "./src/graphql/codegen.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-graphql-request",
      ],
    },
  },
};

export default config;
```

Add script to `package.json`:

```json
{
  "scripts": {
    "graphql": "graphql-codegen --config codegen.ts --watch"
  }
}
```

### 4. Create GitHub Client

Create `src/config/githubConfig.ts`:

```typescript
import { getSdk } from "@/graphql/codegen";
import { GraphQLClient } from "graphql-request";

const client = new GraphQLClient("https://api.github.com/graphql", {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  },
});

export const sdk = getSdk(client);
```

### 5. Get a GitHub Token

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate a new token (classic) with scopes:
   - `read:user` - Read user profile data
   - `repo` - Access repository data (for private repos)
   - `read:org` - Read organization data (if needed)

Add to `.env.local`:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

---

## Writing Queries

### Basic Query Structure

Create `.graphql` files in `src/graphql/queries/`:

```graphql
# src/graphql/queries/GetUser.graphql
query GetUser($login: String!) {
  user(login: $login) {
    id
    name
    avatarUrl
    bio
    company
    location
    email
    websiteUrl
    twitterUsername
    followers {
      totalCount
    }
    following {
      totalCount
    }
  }
}
```

Run codegen to generate types:

```bash
npm run graphql
```

### Using Generated SDK

```typescript
import { sdk } from "@/config/githubConfig";

// Fully typed!
const result = await sdk.GetUser({ login: "octocat" });
console.log(result.user?.name); // Type: string | null | undefined
```

---

## Common Query Patterns

### Fetch User Repositories

```graphql
query GetUserRepos($login: String!, $first: Int = 10) {
  user(login: $login) {
    repositories(
      first: $first
      orderBy: { field: UPDATED_AT, direction: DESC }
      ownerAffiliations: OWNER
    ) {
      totalCount
      nodes {
        id
        name
        description
        url
        stargazerCount
        forkCount
        primaryLanguage {
          name
          color
        }
        updatedAt
        isPrivate
        isFork
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

### Fetch Repository Languages

```graphql
query GetRepoLanguages($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
      edges {
        size
        node {
          name
          color
        }
      }
      totalSize
    }
  }
}
```

### Fetch Repository Dependencies

```graphql
query GetRepoDependencies($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    dependencyGraphManifests {
      totalCount
      nodes {
        filename
        dependencies {
          totalCount
          nodes {
            packageName
            requirements
            hasDependencies
            packageManager
          }
        }
      }
    }
  }
}
```

### Fetch User Contributions

```graphql
query GetUserContributions($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoryContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}
```

### Fetch Pull Requests

```graphql
query GetUserPRs($login: String!, $first: Int = 10) {
  user(login: $login) {
    pullRequests(
      first: $first
      orderBy: { field: CREATED_AT, direction: DESC }
    ) {
      nodes {
        id
        title
        state
        merged
        createdAt
        mergedAt
        repository {
          nameWithOwner
        }
        additions
        deletions
      }
    }
  }
}
```

### Search Repositories

```graphql
query SearchRepos($query: String!, $first: Int = 10) {
  search(query: $query, type: REPOSITORY, first: $first) {
    repositoryCount
    nodes {
      ... on Repository {
        id
        nameWithOwner
        description
        stargazerCount
        primaryLanguage {
          name
        }
      }
    }
  }
}
```

Usage: `sdk.SearchRepos({ query: "language:typescript stars:>1000" })`

---

## Pagination

GitHub GraphQL uses cursor-based pagination.

### Query with Pagination

```graphql
query GetUserReposPaginated($login: String!, $first: Int = 10, $after: String) {
  user(login: $login) {
    repositories(first: $first, after: $after) {
      nodes {
        id
        name
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

### Fetch All Pages

```typescript
async function getAllUserRepos(login: string) {
  const allRepos = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await sdk.GetUserReposPaginated({
      login,
      first: 100,
      after: cursor,
    });

    const repos = result.user?.repositories.nodes ?? [];
    allRepos.push(...repos);

    hasNextPage = result.user?.repositories.pageInfo.hasNextPage ?? false;
    cursor = result.user?.repositories.pageInfo.endCursor ?? null;
  }

  return allRepos;
}
```

---

## Error Handling

### Wrapper Pattern

```typescript
interface AsyncWrapperResponse<T> {
  success: true;
  result: T;
} | {
  success: false;
  message: string;
}

async function asyncWrapper<T>(
  fn: () => Promise<T>
): Promise<AsyncWrapperResponse<T>> {
  try {
    const result = await fn();
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Usage
export async function getUserData(username: string) {
  return asyncWrapper(async () => {
    const result = await sdk.GetUser({ login: username });
    if (!result.user) throw new Error("User not found");
    return result.user;
  });
}
```

### Handle Rate Limits

```typescript
import { GraphQLClient } from "graphql-request";

const client = new GraphQLClient("https://api.github.com/graphql", {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  },
  responseMiddleware: (response) => {
    const rateLimit = response.headers?.get("x-ratelimit-remaining");
    if (rateLimit && parseInt(rateLimit) < 100) {
      console.warn(`GitHub API rate limit low: ${rateLimit} remaining`);
    }
  },
});
```

### Check Rate Limit Status

```graphql
query GetRateLimit {
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
```

---

## Data Transformation

### Adapter Pattern

Transform GraphQL responses to your domain types:

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  repositories: Map<string, Repository>;
}

export interface Repository {
  name: string;
  languages: Set<string>;
  dependencies: Set<string>;
}

// adapters/userAdapter.ts
import { GetUserDataQuery } from "@/graphql/codegen";
import { User, Repository } from "@/types/user";

export function adaptUserData(data: GetUserDataQuery): User | null {
  if (!data?.user) return null;

  const repositories = new Map<string, Repository>();

  for (const repo of data.user.repositories.nodes ?? []) {
    if (!repo) continue;

    const languages = new Set<string>();
    repo.languages?.nodes?.forEach((lang) => {
      if (lang?.name) languages.add(lang.name);
    });

    const dependencies = new Set<string>();
    repo.dependencyGraphManifests?.nodes?.forEach((manifest) => {
      manifest?.dependencies?.nodes?.forEach((dep) => {
        if (dep?.packageName) dependencies.add(dep.packageName);
      });
    });

    repositories.set(repo.id, {
      name: repo.name,
      languages,
      dependencies,
    });
  }

  return {
    id: data.user.id,
    name: data.user.name ?? "",
    avatarUrl: data.user.avatarUrl,
    repositories,
  };
}
```

---

## Next.js Integration

### Server Action

```typescript
// src/server/actions/github-service.ts
"use server";

import { sdk } from "@/config/githubConfig";
import { adaptUserData } from "@/adapters/userAdapter";

export async function getUserData(username: string) {
  const data = await sdk.GetUserData({ login: username });
  if (!data.user) throw new Error("User not found");
  return adaptUserData(data);
}
```

### API Route (if needed)

```typescript
// src/app/api/github/user/[username]/route.ts
import { NextResponse } from "next/server";
import { sdk } from "@/config/githubConfig";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const data = await sdk.GetUser({ login: params.username });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
```

---

## Tips

1. **Use the Explorer**: Test queries at https://docs.github.com/en/graphql/overview/explorer

2. **Request Only What You Need**: GraphQL lets you fetch exactly the fields you need - keep queries minimal

3. **Batch Related Data**: Fetch related data in a single query instead of multiple requests

4. **Cache Responses**: GitHub data doesn't change frequently - consider caching

5. **Handle Nulls**: GitHub's schema has many nullable fields - always handle `null`/`undefined`

6. **Watch Rate Limits**: 5,000 points/hour for authenticated requests. Complex queries cost more points.

---

## Resources

- [GitHub GraphQL API Docs](https://docs.github.com/en/graphql)
- [GraphQL Explorer](https://docs.github.com/en/graphql/overview/explorer)
- [Public Schema Reference](https://docs.github.com/en/graphql/reference)
- [graphql-codegen Docs](https://the-guild.dev/graphql/codegen)
