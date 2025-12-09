# GitHub Retrospective 2025 - Implementation Plan

## Step 1: MongoDB Setup & Schema
- [ ] Install MongoDB driver (`mongodb`)
- [ ] Create database connection utility (`lib/mongodb.ts`)
- [ ] Define GitHubUser schema with fields:
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
    - `firstCommit` ({ date, repo, message })
    - `lastCommit` ({ date, repo, message })
- [ ] Create mock data JSON for testing

**Checkpoint: Review schema before proceeding**

---

## Step 2: Initial Page with Username Input
- [ ] Install shadcn/ui and configure
- [ ] Create landing page with:
  - Hero section with title/description
  - Username input form
  - Submit button
- [ ] Create server action to handle form submission
- [ ] Add loading state

**Checkpoint: Review UI before proceeding**

---

## Step 3: Database Integration & Test Flow
- [ ] Create MongoDB queries:
  - `findUserByUsername`
  - `upsertUser`
- [ ] Implement data freshness check (3-day cache)
- [ ] Create temporary results page that displays raw user data
- [ ] Test with mock data inserted via MongoDB Compass

**Checkpoint: Review database flow before GitHub integration**

---

## Step 4: GitHub API Integration
- [ ] Set up GitHub GraphQL client
- [ ] Create queries for:
  - User contributions (commits, PRs, issues)
  - Repositories (created, contributed to)
  - Languages across repos
  - Contribution calendar (for streak calculation)
- [ ] Implement rate limiting handling
- [ ] Create `fetchGitHubMetrics` service
- [ ] Test with real GitHub usernames

**Checkpoint: Review API integration before building steps**

---

## Step 5: Retrospective Steps UI
- [ ] Design step-by-step navigation (Spotify/Duolingo style)
- [ ] Store fetched data in localStorage for step navigation
- [ ] Create individual step components:

### Step 5a: Total Commits
- [ ] Animated counter
- [ ] Comparison with average user

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

### Step 5f: First & Last Commit
- [ ] Display first commit of 2025 (date, repo, message)
- [ ] Display last commit of 2025 (date, repo, message)
- [ ] "Your year in code" narrative

### Step 5g: Summary & Comparison
- [ ] Overall stats summary
- [ ] Compare with other users who used the app

**Checkpoint: Review each step before proceeding to next**

---

## Step 6: Sharing & Final CTA
- [ ] Generate shareable image/card with stats
- [ ] Share buttons (Twitter/X, LinkedIn, copy link)
- [ ] CTA to star the GitHub repo
- [ ] Option to re-run for different username

**Checkpoint: Final review**

---

## Additional Metrics to Consider (Future)
- Most active day of the week
- Most active hour of the day
