# GitHub Retrospective 2025 - Implementation Plan

## Step 1: MongoDB Setup & Schema ✅

- [x] Install MongoDB driver (`mongodb`)
- [x] Create database connection utility (`lib/mongodb.ts`)
- [x] Define GitHubUser schema with fields (`lib/types/github-user.ts`):
  - `username` (string, unique)
  - `fetchedAt` (Date)
  - `metrics`:
    - `totalCommits` (number)
    - `longestStreak` (consecutive days)
    - `reposCreated` (number)
    - `reposContributed` (number) - repos from other people
    - `reposForked` (number)
    - `languages` (array of {name, percentage})
    - `totalPRs` (number)
    - `totalIssues` (number)
    - `codeReviewComments` (number)
    - `starsReceived` (number)
    - `topRepos` (array of most active repos)
    - `firstCommit` ({ date, repo, message, url })
    - `lastCommit` ({ date, repo, message, url })
- [x] Create mock data JSON for testing (`mock-data.json`)
- [x] Create server action to fetch user (`app/actions/user.ts`)
- [x] Test MongoDB connection with mock data

**Checkpoint: ✅ Schema reviewed and tested**

---

## Step 2: Initial Page with Username Input ✅

- [x] Install shadcn/ui and configure
- [x] Create landing page with:
  - Hero section with title/description
  - Username input form
  - Submit button
- [x] Create server action to handle form submission
- [x] Add loading state

**Checkpoint: ✅ UI reviewed and ready**

---

## Step 3: Database Integration & Test Flow ✅

- [x] Create MongoDB queries:
  - `findUserByUsername` (done as `getUserByUsername`)
  - `upsertUser` (moved to Step 4)
- [x] Implement data freshness check (3-day cache) - moved to Step 4
- [x] Create temporary results page that displays raw user data
- [x] Test with mock data inserted via MongoDB Compass

**Checkpoint: ✅ Database flow ready, remaining items merged into Step 4**

---

## Step 4: GitHub API Integration ✅

- [x] Set up GitHub GraphQL client (`@octokit/graphql`)
- [x] Create queries for:
  - User contributions (commits, PRs, issues)
  - Repositories (created, contributed to)
  - Languages across repos
  - Contribution calendar (for streak calculation)
- [x] Implement rate limiting handling
- [x] Create `fetchGitHubMetrics` service (`lib/services/github.ts`)
- [x] Create `upsertUser` MongoDB function
- [x] Implement data freshness check (3-day cache)
- [x] Test with real GitHub usernames (requires GITHUB_TOKEN in .env.local)

**Checkpoint: ✅ API integration complete - add GITHUB_TOKEN to .env.local to test**

---

## Step 5: Retrospective Steps UI ✅
Use stepper component from react bits

- [x] Design step-by-step navigation (Spotify/Duolingo style)
- [x] Store fetched data in localStorage for step navigation
- [x] Create individual step components:

### Step 5a: First & Last Commit ✅

- [x] Display first commit of 2025 (date, repo, message)
- [x] Display last commit of 2025 (date, repo, message)
- [x] "Your year in code" narrative
Message: I was a long journey this year, do you remember your first commit?: <first commit data>

**Route:** `/retrospective/[username]/first-commit`

### Step 5b: Total Commits
Use Count Up react bits component
- [ ] Animated counter
- [ ] Comparison with average user
Message: Since there you create more <total commits> commits

### Step 5b: Coding Streak

- [ ] Longest consecutive days
- [ ] Calendar visualization

### Step 5c: Repositories

- [ ] Repos created vs contributed vs forked
- [ ] Top repos by activity

### Step 5d: Languages

- [ ] Language breakdown chart
- [ ] Most used language highlight

### Step 5e: Community Impact

- [ ] PRs, issues, stars received
- [ ] Code review comments
- [ ] Contributions to others' repos



### Step 5g: Summary & Comparison

- [ ] Overall stats summary
- [ ] Compare with other users who used the app

**Checkpoint: Review each step before proceeding to next**

---

## Step 6: Cleanup

- [ ] Remove `/retrospective/[username]/raw` page (debug page for viewing raw database data)

---

## Step 7: Sharing & Final CTA

- [ ] Generate shareable image/card with stats
- [ ] Share buttons (Twitter/X, LinkedIn, copy link)
- [ ] CTA to star the GitHub repo
- [ ] Option to re-run for different username

**Checkpoint: Final review**

---

## Additional Metrics to Consider (Future)

- Most active day of the week
- Most active hour of the day
