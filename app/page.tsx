import { getUserByUsername } from "./actions/user";

export default async function Home() {
  // Test fetching user from MongoDB
  const user = await getUserByUsername("octocat");

  console.log("Fetched user from MongoDB:", JSON.stringify(user, null, 2));

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between bg-white px-16 py-32 dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            GitHub Retrospective 2025
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Testing MongoDB connection...
          </p>
          <pre className="max-w-full overflow-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {user
              ? JSON.stringify(user, null, 2)
              : "No user found. Make sure to insert mock-data.json into MongoDB Atlas."}
          </pre>
        </div>
      </main>
    </div>
  );
}
