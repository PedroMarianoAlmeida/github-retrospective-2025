# Next.js Architecture Patterns

This cookbook documents the architectural patterns and best practices for building Next.js 16 applications in this monorepo, specifically focusing on the `ratata` app's proven patterns.

## Table of Contents

1. [Server Actions Pattern](#server-actions-pattern)
2. [Server/Client Component Separation](#serverclient-component-separation)
3. [shadcn/ui Component Usage](#shadcnui-component-usage)
4. [Design System & Colors](#design-system--colors)
5. [Form Patterns](#form-patterns)
6. [Loading States & Error Handling](#loading-states--error-handling)
7. [Toast Notifications](#toast-notifications)
8. [Layout Patterns](#layout-patterns)

---

## Server Actions Pattern

### Using @repo/core Server Action Wrapper

All server actions in this monorepo use the `@repo/core` package for consistent error handling and type safety.

### Setup

The `@repo/core` package provides:
- `serverActionWrapper<T>()` - Wrapper function for consistent error handling
- `ServerActionResponse<T>` - Type definition for all server action responses
- `isSuccess()` and `isError()` - Type guards for response handling

### Pattern

**✅ Standard Pattern**:

```typescript
"use server";

import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import {
  serverActionWrapper,
  type ServerActionResponse,
} from "@repo/core/server";

export interface UserData {
  email: string;
  username: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  createdAt?: Date;
}

/**
 * Create a new user in the database
 */
export async function createUser(
  data: UserData
): Promise<ServerActionResponse<UserResponse>> {
  return serverActionWrapper(async () => {
    // Connect to MongoDB
    await connectDB();

    // Validate required fields
    if (!data.email || !data.username) {
      throw new Error("Email and username are required");
    }

    // Create new user
    let user;
    try {
      user = await User.create({
        email: data.email,
        username: data.username,
      });
    } catch (error: any) {
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`A user with this ${field} already exists`);
      }

      // Handle validation errors with details
      if (error.name === "ValidationError") {
        const details = Object.values(error.errors).map(
          (err: any) => err.message
        );
        const validationError: any = new Error("Validation failed");
        validationError.details = details;
        throw validationError;
      }

      throw error;
    }

    // Revalidate affected paths
    revalidatePath("/");

    // Return just the data - wrapper adds { success: true, data: ... }
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  });
}
```

### Response Structure

All server actions return a `ServerActionResponse<T>`:

**Success Response**:
```typescript
{
  success: true,
  data: T  // Your response data
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string,      // Error message
  details?: string[]  // Optional validation details
}
```

### Client-Side Usage

**✅ Recommended Pattern**:

```typescript
"use client";

import { createUser } from "@/server/actions/database/user";
import { toast } from "sonner";

const result = await createUser(data);

if (result.success) {
  toast.success("User created successfully!");
  // Access data with result.data
  console.log(result.data.id);
  router.push("/dashboard");
} else {
  toast.error(result.error);

  // Handle validation errors
  if (result.details) {
    result.details.forEach(detail => {
      toast.error(detail);
    });
  }
}
```

### Using Type Guards

```typescript
import { isSuccess, isError } from "@repo/core/server";

const result = await createUser(data);

if (isSuccess(result)) {
  // TypeScript knows result.data exists
  console.log(result.data.id);
} else {
  // TypeScript knows result.error exists
  console.error(result.error);
  if (result.details) {
    result.details.forEach(detail => console.error(detail));
  }
}
```

### Key Benefits

1. **Consistency**: All server actions follow the same pattern
2. **Type Safety**: Full TypeScript support with proper type inference
3. **Error Handling**: Automatic error catching and logging
4. **Validation Support**: Built-in support for validation error details
5. **Reusability**: Shared across all Next.js apps in the monorepo
6. **Maintainability**: Single source of truth for error handling logic

### Common Patterns

**Not Found Pattern**:
```typescript
export async function getUserById(
  id: string
): Promise<ServerActionResponse<UserResponse>> {
  return serverActionWrapper(async () => {
    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    // ✅ Transform MongoDB document to match interface
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  });
}
```

**List Pattern**:
```typescript
export interface UsersListResponse {
  count: number;
  users: any[];
}

export async function getUsers(): Promise<
  ServerActionResponse<UsersListResponse>
> {
  return serverActionWrapper(async () => {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 });

    return {
      count: users.length,
      users: JSON.parse(JSON.stringify(users)),
    };
  });
}
```

### ⚠️ Important: MongoDB Field Transformation

When using MongoDB/Mongoose, always explicitly transform documents to match your TypeScript interfaces.

**❌ Common Mistake**:
```typescript
export async function getUserByEmail(
  email: string
): Promise<ServerActionResponse<UserResponse>> {
  return serverActionWrapper(async () => {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    // ❌ BAD: Returns { _id, email, username } but interface expects { id, ... }
    return JSON.parse(JSON.stringify(user));
  });
}
```

**Why This Fails**:
- MongoDB documents have `_id` field (ObjectId)
- Your TypeScript interface expects `id` field (string)
- Client code accessing `result.data.id` will be `undefined`
- This causes runtime errors like "User not found" even when user exists

**✅ Correct Pattern**:
```typescript
export async function getUserByEmail(
  email: string
): Promise<ServerActionResponse<UserResponse>> {
  return serverActionWrapper(async () => {
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    // ✅ GOOD: Explicitly transform _id to id
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  });
}
```

**Key Takeaways**:
1. **Never** use `JSON.parse(JSON.stringify(doc))` for single documents - it doesn't transform `_id` to `id`
2. **Always** explicitly map MongoDB fields to match your TypeScript interfaces
3. **Convert** ObjectId to string using `.toString()`
4. **Test** that `result.data.id` (not `result.data._id`) works in client code

**When to Use JSON.stringify**:
Only use it for arrays/lists where you're preserving the raw structure:
```typescript
// ✅ OK for lists (client code handles _id)
return {
  count: users.length,
  users: JSON.parse(JSON.stringify(users)),
};
```

### Reference Examples

- **Complete implementation**: `apps/ratata/server/actions/database/user.ts`
- **Package source**: `packages/core/src/server/action-wrapper.ts`
- **Client usage**: `apps/ratata/app/register/components/RegisterForm.tsx`

---

## Server/Client Component Separation

### Principle

In Next.js 16, default to **Server Components** and only use **Client Components** when you need:
- Browser APIs (localStorage, window, etc.)
- Event handlers (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Third-party libraries that require client-side rendering

### Pattern: Split Page into Server + Client

**❌ Bad Pattern** (Everything client-side):
```tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getUserByEmail } from "@/server/actions/database/user";

export default function Register() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      if (session?.user?.email) {
        const result = await getUserByEmail(session.user.email);
        if (result.success) {
          router.push("/auth/dashboard");
        }
      }
      setIsLoading(false);
    }
    checkUser();
  }, [session]);

  // Form JSX...
}
```

**✅ Good Pattern** (Server component + Client component):

**`page.tsx` (Server Component)**:
```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserByEmail } from "@/server/actions/database/user";
import { redirect } from "next/navigation";
import RegisterForm from "./components/RegisterForm";

export default async function Register() {
  // Server-side data fetching
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  // Server-side user check
  const result = await getUserByEmail(session.user.email);
  if (result.success) {
    redirect("/auth/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <RegisterForm email={session.user.email} />
    </main>
  );
}
```

**`components/RegisterForm.tsx` (Client Component)**:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/server/actions/database/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RegisterFormProps {
  email: string;
}

export default function RegisterForm({ email }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await createUser({ email, username });

    if (result.success) {
      router.push("/auth/dashboard");
    }
    setIsSubmitting(false);
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Benefits of This Pattern

1. **Performance**: Server-side data fetching is faster (no waterfall requests)
2. **Security**: Authentication checks happen server-side before page renders
3. **SEO**: Server-rendered content is immediately available
4. **Reduced JavaScript**: Less client-side code to download and execute
5. **Better DX**: Server components can use async/await directly

### Reference Examples

- **Server component with data fetching**: `apps/ratata/app/invite/[meet-id]/page.tsx`
- **Client component for forms**: `apps/ratata/app/invite/[meet-id]/components/JoinRequest.tsx`
- **Split register page**: `apps/ratata/app/register/page.tsx` + `apps/ratata/app/register/components/RegisterForm.tsx`

---

## shadcn/ui Component Usage

### Always Use shadcn Components

Replace plain HTML elements with shadcn/ui components for consistency and accessibility.

### Common Component Replacements

| HTML Element | shadcn Component | Import |
|--------------|------------------|--------|
| `<button>` | `<Button>` | `@/components/ui/button` |
| `<input>` | `<Input>` | `@/components/ui/input` |
| `<label>` | `<Label>` | `@/components/ui/label` |
| `<div>` (card) | `<Card>` | `@/components/ui/card` |
| Toast | `toast()` | `sonner` |

### Card Layout Pattern

**❌ Bad Pattern**:
```tsx
<div className="border rounded-lg p-6">
  <h1 className="text-2xl font-bold">Title</h1>
  <p className="text-gray-600">Description</p>
  {/* Content */}
</div>
```

**✅ Good Pattern**:
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Button Pattern

**❌ Bad Pattern**:
```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
>
  Submit
</button>
```

**✅ Good Pattern**:
```tsx
import { Button } from "@/components/ui/button";

<Button
  type="submit"
  disabled={isSubmitting}
  size="lg"
  className="w-full"
>
  Submit
</Button>
```

### Form Field Pattern

**❌ Bad Pattern**:
```tsx
<div>
  <label htmlFor="username" className="block text-sm font-medium mb-2">
    Username
  </label>
  <input
    type="text"
    id="username"
    className="w-full px-4 py-2 border rounded-lg focus:ring-2"
  />
</div>
```

**✅ Good Pattern**:
```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input
    type="text"
    id="username"
    placeholder="Enter username"
  />
</div>
```

### Reference Examples

- **Card usage**: `apps/ratata/app/auth/dashboard/event-admin/details/[event-id]/page.tsx`
- **Form components**: `apps/ratata/app/register/components/RegisterForm.tsx`
- **Button variants**: `apps/ratata/components/ui/button.tsx`

---

## Design System & Colors

### Never Hardcode Colors

Use semantic color tokens from the design system instead of hardcoded Tailwind colors.

### Color Token Mapping

| ❌ Hardcoded | ✅ Semantic Token | Use Case |
|-------------|-------------------|----------|
| `text-gray-600` | `text-muted-foreground` | Secondary text |
| `text-red-600` | `text-destructive` | Error messages |
| `bg-blue-600` | `bg-primary` | Primary buttons |
| `hover:bg-blue-700` | `hover:bg-primary/90` | Button hover |
| `text-gray-500` | `text-muted-foreground` | Helper text |
| `border-gray-300` | `border` | Default borders |
| `bg-white dark:bg-gray-800` | `bg-card` | Card backgrounds |

### Pattern Examples

**❌ Bad Pattern**:
```tsx
<p className="text-gray-600 dark:text-gray-400">
  Secondary text
</p>
<p className="text-red-600 dark:text-red-400">
  Error message
</p>
<button className="bg-blue-600 hover:bg-blue-700 text-white">
  Submit
</button>
```

**✅ Good Pattern**:
```tsx
<p className="text-muted-foreground">
  Secondary text
</p>
<p className="text-destructive">
  Error message
</p>
<Button>Submit</Button>
```

### Benefits

1. **Automatic dark mode**: Semantic tokens adapt to theme
2. **Consistency**: Same visual language across the app
3. **Maintainability**: Theme changes update everywhere
4. **Accessibility**: Proper contrast ratios built-in

### Reference Examples

- **Semantic tokens in use**: `apps/ratata/app/register/components/RegisterForm.tsx`
- **Theme configuration**: `apps/ratata/app/globals.css`

---

## Form Patterns

### Form Submission Pattern

**✅ Standard Pattern**:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createUser } from "@/server/actions/database/user";

export default function UserForm({ email }: { email: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors([]);
    setIsSubmitting(true);

    try {
      const result = await createUser({ email, username });

      if (result.success) {
        toast.success("User created successfully!");
        router.push("/auth/dashboard");
        router.refresh();
      } else {
        if (result.details && result.details.length > 0) {
          setErrors(result.details);
        } else if (result.error) {
          setErrors([result.error]);
        }
        toast.error("Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setErrors(["An unexpected error occurred. Please try again."]);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          required
        />
        {errors.length > 0 && (
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !username}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}
```

### Key Elements

1. **Loading state**: `isSubmitting` disables form during submission
2. **Error handling**: Display server-side validation errors
3. **Toast feedback**: User-friendly success/error notifications
4. **Router actions**: `router.push()` and `router.refresh()` after success
5. **Disabled state**: Prevent double-submission

### Reference Examples

- **Form with validation**: `apps/ratata/app/register/components/RegisterForm.tsx`
- **Form with toast**: `apps/ratata/app/invite/[meet-id]/components/JoinRequest.tsx`

---

## Loading States & Error Handling

### Server Component Pattern

**✅ Server-side checks with redirects**:
```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session?.user?.email) {
    redirect("/");
  }

  // Server-side data fetching
  const data = await fetchData();

  // Show error state if needed
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load data</p>
        </CardContent>
      </Card>
    );
  }

  return <div>{/* Success state */}</div>;
}
```

### Client Component Pattern

**✅ Loading and error states**:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function InteractiveComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await performAction();
      if (!result.success) {
        setError(result.error || "Action failed");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button onClick={handleAction} disabled={isLoading}>
        {isLoading ? "Loading..." : "Submit"}
      </Button>
    </div>
  );
}
```

### Reference Examples

- **Server-side error handling**: `apps/ratata/app/auth/dashboard/event-admin/details/[event-id]/page.tsx`
- **Client-side loading**: `apps/ratata/app/register/components/RegisterForm.tsx`

---

## Toast Notifications

### Setup

The app uses `sonner` for toast notifications. It's already set up in the root layout.

### Usage Pattern

**✅ Standard toast usage**:
```tsx
"use client";

import { toast } from "sonner";

// Success toast
toast.success("Operation completed successfully!");

// Error toast
toast.error("Operation failed. Please try again.");

// Info toast
toast.info("Processing your request...");

// Toast with action
toast.success("Event created!", {
  action: {
    label: "View",
    onClick: () => router.push("/event/123"),
  },
});
```

### When to Use Toasts

- ✅ After form submission (success or error)
- ✅ After async actions complete
- ✅ For non-blocking feedback
- ❌ For critical errors (use inline error messages)
- ❌ For permanent information (use static text)

### Reference Examples

- **Toast with form submission**: `apps/ratata/app/register/components/RegisterForm.tsx`
- **Toast with server actions**: `apps/ratata/app/invite/[meet-id]/components/JoinRequest.tsx`

---

## Layout Patterns

### Centered Layout with Card

**✅ Standard pattern for forms and single-focus pages**:
```tsx
<main className="flex min-h-screen items-center justify-center p-8">
  <Card className="w-full max-w-md">
    <CardHeader>
      <CardTitle>Page Title</CardTitle>
      <CardDescription>Page description</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
</main>
```

### Full-width Layout

**✅ Standard pattern for dashboards and content pages**:
```tsx
<main className="container mx-auto py-8">
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Welcome back!</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Cards */}
    </div>
  </div>
</main>
```

### Spacing Patterns

Use consistent spacing utilities:
- `space-y-2`: Tight spacing (form fields, list items)
- `space-y-4`: Medium spacing (form sections, cards)
- `space-y-6`: Loose spacing (major sections)
- `space-y-8`: Extra loose spacing (page sections)

### Reference Examples

- **Centered layout**: `apps/ratata/app/register/page.tsx`
- **Full-width layout**: `apps/ratata/app/auth/dashboard/page.tsx`
- **Card grid**: `apps/ratata/app/auth/dashboard/event-admin/details/[event-id]/page.tsx`

---

## Quick Reference Checklist

When building a new page or component, check:

**Server Actions**:
- [ ] Are server actions using `serverActionWrapper` from `@repo/core/server`?
- [ ] Are return types using `ServerActionResponse<T>`?
- [ ] Are errors thrown (not returned) in server actions?
- [ ] Are MongoDB documents explicitly transformed (`_id` → `id`)?
- [ ] Are client components properly handling `result.success` and `result.data`?

**Components**:
- [ ] Is it a Server Component by default?
- [ ] Does it only use "use client" when necessary?
- [ ] Are you using shadcn components instead of plain HTML?
- [ ] Are you using semantic color tokens (not hardcoded colors)?

**Forms & Feedback**:
- [ ] Does form submission include loading states and error handling?
- [ ] Are you using toast notifications for user feedback?
- [ ] Are error messages using `text-destructive`?
- [ ] Are secondary text elements using `text-muted-foreground`?

**Layout**:
- [ ] Is the layout consistent with existing pages?
- [ ] Are you using proper spacing utilities (`space-y-*`)?

---

## Related Documentation

- **Root architecture**: See `CLAUDE.md` for monorepo structure
- **App-specific patterns**: See `apps/ratata/CLAUDE.md` for data models and authentication
- **shadcn setup**: See `.claude/cookbooks/shadcn-setup.md`
- **Dark mode**: See `.claude/cookbooks/dark-mode-setup.md`
- **Authentication**: See `.claude/cookbooks/nextauth-setup.md`
