# Github retrospective

## General overview

I want to mimic Spotify and Duolingo style retrospective for the year of 2025

So the initial page is a input to add a github username

After click in submit, fetch github data to create a step by step of how the specific user uses github this year

I am thinking in:
How many commits
How many consecutive days coding
How many repos created
How many repos from other people contributions
How many languages has the repos
I am open to more metrics, feel free to suggest

Compare the current user with others that already use the webapp

CTA to share with friends
Ask to star the github hub

## Tech stack (check cookbooks)

- NextJs
- Shadcn
- MongoDB
- Github api
- GraphQL

## Database

Only one collection, githubUser
There have the github username and all metrics

## Dataflow

- User add github username at input
- Check mongoDB of the user is already there
- Check if all fields on schema is existent (if not means a new field was added before the previous fetch)
- If all is there and was fetched less then 3 days, use this data
- Else fetch the data from github, then add/edit on mongoDB
- Prepare the first step or the retrospective, all future steps will use this same data (add in cookies or local storage, no need to fetch data each step)

## Plan draft

- Create mongoDB schema (also create a mock data - I can manually add it at mongoDB compass)
- Create the initial page with the input
- Test the flow when the user is existent (the temporary step 1 should only plot all github/database info from the user)
- Create the github integration (then I will test add more users and then I will test the flow)
- Then each metric in a new step on the plan

## Methodology

Stop and ask for revision after each plan step
