# Server Actions Patterns

Best practices and patterns for Next.js 16 server actions with MongoDB/Mongoose, extracted from ratata and usd-latam-jobs implementations.

## Overview

Server actions provide a type-safe way to perform server-side operations from React components. This cookbook covers patterns for consistent error handling, authorization, validation, and caching.

## 1. The serverActionWrapper Pattern

All server actions should use the shared `serverActionWrapper` from `@repo/core/server`:

```typescript
// packages/core/src/server/action-wrapper.ts
export type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: string[] }

export function serverActionWrapper<T>(
  callback: () => Promise<T>
): Promise<ServerActionResponse<T>>
```

### Usage

```typescript
"use server";

import { serverActionWrapper } from "@repo/core/server";
import connectDB from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createItem(data: ItemData): Promise<ServerActionResponse<ItemResponse>> {
  return serverActionWrapper(async () => {
    await connectDB();

    // Validation
    if (!data.name) {
      throw new Error("Name is required");
    }

    // Database operation
    const item = await Item.create(data);

    // Cache invalidation
    revalidatePath("/items");

    // Return normalized response
    return {
      id: item._id.toString(),
      name: item.name,
    };
  });
}
```

### Benefits

- Consistent error handling across all actions
- Type-safe discriminated union responses
- Automatic error logging
- Support for validation error details array

### Client-Side Consumption

```typescript
"use client";

import { createItem } from "@/server/actions/database/item";
import { isSuccess, isError } from "@repo/core/server";

async function handleSubmit() {
  const result = await createItem(formData);

  if (isSuccess(result)) {
    toast.success("Item created");
    router.push(`/items/${result.data.id}`);
  } else {
    toast.error(result.error);
    if (result.details) {
      result.details.forEach(d => console.error(d));
    }
  }
}
```

## 2. Server Action Structure

### File Organization

```
server/actions/database/
├── user.ts           # User CRUD operations
├── event.ts          # Event CRUD operations
├── participant.ts    # Participant operations
├── payment.ts        # Payment operations
└── event-admin-page.ts  # Optimized compound queries
```

### Standard Action Template

```typescript
"use server";

import connectDB from "@/lib/db";
import Model from "@/lib/models/Model";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { serverActionWrapper, type ServerActionResponse } from "@repo/core/server";

// Response interface (what clients receive)
export interface ItemResponse {
  id: string;
  name: string;
  createdAt?: Date;
}

export async function getItemById(id: string): Promise<ServerActionResponse<ItemResponse>> {
  return serverActionWrapper(async () => {
    // 1. Connect to database
    await connectDB();

    // 2. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid item ID");
    }

    // 3. Fetch data
    const item = await Model.findById(id).select("-__v");

    if (!item) {
      throw new Error("Item not found");
    }

    // 4. Return normalized response (convert ObjectIds to strings)
    return {
      id: item._id.toString(),
      name: item.name,
      createdAt: item.createdAt,
    };
  });
}
```

## 3. Authorization Pattern (MISSING - TO IMPLEMENT)

**Critical Issue Found**: Both projects lack authorization checks in server actions. Any authenticated user can modify any resource if they know the ID.

### Current (Insecure)

```typescript
export async function updateEventName(eventId: string, newName: string) {
  return serverActionWrapper(async () => {
    await connectDB();
    // ❌ No check if user owns this event!
    const event = await Event.findByIdAndUpdate(eventId, { name: newName });
    return event;
  });
}
```

### Recommended (Secure)

```typescript
export async function updateEventName(eventId: string, newName: string) {
  return serverActionWrapper(async () => {
    // 1. Get current user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    // 2. Lookup user in database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new Error("User not found");
    }

    // 3. Verify ownership
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.eventAdminId.toString() !== user._id.toString()) {
      throw new Error("You don't have permission to modify this event");
    }

    // 4. Now safe to update
    const updated = await Event.findByIdAndUpdate(
      eventId,
      { name: newName },
      { new: true }
    );

    revalidatePath(`/auth/event-details/${eventId}`);
    return { name: updated.name };
  });
}
```

### Reusable Authorization Helper

```typescript
// lib/auth-helpers.ts
export async function requireEventOwner(eventId: string): Promise<{ user: IUser; event: IEvent }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    throw new Error("User not found");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.eventAdminId.toString() !== user._id.toString()) {
    throw new Error("Forbidden");
  }

  return { user, event };
}

// Usage in server action
export async function updateEventName(eventId: string, newName: string) {
  return serverActionWrapper(async () => {
    const { event } = await requireEventOwner(eventId);
    // Now safe to proceed...
  });
}
```

## 4. Validation Patterns

### Input Validation

```typescript
export async function createEvent(data: EventData) {
  return serverActionWrapper(async () => {
    await connectDB();

    // Manual validation before database
    if (!data.name?.trim()) {
      throw new Error("Event name is required");
    }

    if (data.name.trim().length < 3 || data.name.trim().length > 100) {
      throw new Error("Event name must be between 3 and 100 characters");
    }

    // Date validation
    const eventDate = new Date(data.when);
    if (eventDate < new Date()) {
      throw new Error("Event date must be in the future");
    }

    // ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(data.eventAdminId)) {
      throw new Error("Invalid admin ID");
    }

    const event = await Event.create({
      ...data,
      name: data.name.trim(),
    });

    return { id: event._id.toString() };
  });
}
```

### Mongoose Validation Errors

Handle Mongoose validation errors and convert to user-friendly format:

```typescript
try {
  const item = await Model.create(data);
} catch (error: any) {
  // Duplicate key error (unique constraint)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    throw new Error(`A record with this ${field} already exists`);
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const details = Object.values(error.errors).map((err: any) => err.message);
    const validationError: any = new Error("Validation failed");
    validationError.details = details;
    throw validationError;
  }

  throw error;
}
```

## 5. Cache Invalidation

### Pattern

Always call `revalidatePath()` after mutations:

```typescript
export async function updateEvent(eventId: string, data: Partial<EventData>) {
  return serverActionWrapper(async () => {
    await connectDB();

    const event = await Event.findByIdAndUpdate(eventId, data, { new: true });

    // Invalidate all affected paths
    revalidatePath("/auth/dashboard");
    revalidatePath(`/auth/event-details/${eventId}`);

    return { id: event._id.toString() };
  });
}
```

### When to Revalidate

| Action | Paths to Revalidate |
|--------|---------------------|
| Create | List pages |
| Update | List pages + Detail page |
| Delete | List pages |
| Status change | List pages + Detail page |

## 6. Optimized Compound Queries

For pages that need multiple related data, create optimized queries:

```typescript
// server/actions/database/event-admin-page.ts
export async function getEventAdminPageData(eventId: string) {
  return serverActionWrapper(async () => {
    await connectDB();

    // Single parallel fetch for all related data
    const [event, participants, payments] = await Promise.all([
      Event.findById(eventId).lean(),
      Participant.find({ eventId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ eventId }).lean(),
    ]);

    if (!event) {
      throw new Error("Event not found");
    }

    // Serialize for client (removes Mongoose internals)
    return JSON.parse(JSON.stringify({
      event,
      participants,
      payments,
    }));
  });
}
```

## 7. Pagination Pattern

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getJobs(
  page: number = 1,
  pageSize: number = 10
): Promise<ServerActionResponse<PaginatedResponse<JobResponse>>> {
  return serverActionWrapper(async () => {
    await connectDB();

    const skip = (page - 1) * pageSize;

    const [jobs, totalCount] = await Promise.all([
      Job.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("stack")
        .lean(),
      Job.countDocuments({}),
    ]);

    return {
      items: jobs.map(normalizeJob),
      totalCount,
      page,
      pageSize,
      hasMore: skip + jobs.length < totalCount,
    };
  });
}
```

## 8. Common Mistakes to Avoid

### ❌ Not Validating ObjectIds

```typescript
// BAD - will throw cryptic Mongoose error
const event = await Event.findById(userInput);

// GOOD - validate first
if (!mongoose.Types.ObjectId.isValid(userInput)) {
  throw new Error("Invalid ID format");
}
const event = await Event.findById(userInput);
```

### ❌ Returning Mongoose Documents Directly

```typescript
// BAD - contains Mongoose internals, may cause serialization issues
return event;

// GOOD - normalize to plain object
return {
  id: event._id.toString(),
  name: event.name,
};

// OR use .lean() for read queries
const event = await Event.findById(id).lean();
return JSON.parse(JSON.stringify(event));
```

### ❌ Missing Error Handling for Unique Constraints

```typescript
// BAD - generic error
await User.create({ email });

// GOOD - handle duplicate key
try {
  await User.create({ email });
} catch (error: any) {
  if (error.code === 11000) {
    throw new Error("Email already registered");
  }
  throw error;
}
```

### ❌ Not Connecting to Database

```typescript
// BAD - may fail if connection not established
const users = await User.find({});

// GOOD - always connect first
await connectDB();
const users = await User.find({});
```

### ❌ Hardcoding Revalidation Paths

Consider creating a constants file for paths:

```typescript
// lib/paths.ts
export const PATHS = {
  dashboard: "/auth/dashboard",
  eventDetails: (id: string) => `/auth/event-details/${id}`,
} as const;

// Usage
revalidatePath(PATHS.dashboard);
revalidatePath(PATHS.eventDetails(eventId));
```

## 9. Testing Server Actions

```typescript
// __tests__/actions/event.test.ts
import { createEvent } from "@/server/actions/database/event";

describe("createEvent", () => {
  it("should require a name", async () => {
    const result = await createEvent({ name: "", eventAdminId: "..." });

    expect(result.success).toBe(false);
    expect(result.error).toContain("required");
  });

  it("should create event with valid data", async () => {
    const result = await createEvent({
      name: "Test Event",
      eventAdminId: validUserId,
      when: futureDate,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBeDefined();
    }
  });
});
```

## 10. Summary Checklist

When creating a new server action:

- [ ] Use `serverActionWrapper` for consistent error handling
- [ ] Add `"use server"` directive at top of file
- [ ] Call `await connectDB()` before any database operation
- [ ] Validate ObjectId format before using in queries
- [ ] Add authorization check (verify user owns the resource)
- [ ] Handle Mongoose validation errors with details
- [ ] Handle duplicate key errors (code 11000)
- [ ] Normalize response (convert ObjectIds to strings)
- [ ] Call `revalidatePath()` for affected routes
- [ ] Define TypeScript interfaces for request/response
