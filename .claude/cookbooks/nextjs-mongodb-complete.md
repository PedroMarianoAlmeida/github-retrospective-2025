# Next.js + MongoDB Complete Setup

A single, comprehensive guide for setting up MongoDB with Mongoose in Next.js applications. Copy this file to any new project.

## Table of Contents

1. [Installation](#1-installation)
2. [Database Connection](#2-database-connection)
3. [Server Action Wrapper](#3-server-action-wrapper)
4. [Model Definitions](#4-model-definitions)
5. [Server Actions (CRUD)](#5-server-actions-crud)
6. [Query Patterns](#6-query-patterns)
7. [Authorization](#7-authorization)
8. [Validation](#8-validation)
9. [Advanced Patterns](#9-advanced-patterns)
10. [Middleware Integration](#10-middleware-integration)
11. [Troubleshooting](#11-troubleshooting)
12. [Quick Reference](#12-quick-reference)

---

## 1. Installation

```bash
# For standalone Next.js project
npm install mongoose

# For Yarn workspace/monorepo
yarn add mongoose
# or
yarn workspace <app-name> add mongoose
```

### Environment Variables

Add to `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

---

## 2. Database Connection

Create `lib/db.ts` with connection caching to prevent pool exhaustion during Next.js hot reload:

```typescript
// lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
```

### Why This Pattern?

- **Hot Reload Protection**: Next.js re-executes modules on hot reload; caching prevents multiple connections
- **Promise Caching**: Prevents race conditions when multiple components connect simultaneously
- **Buffer Commands Disabled**: Queries fail immediately if not connected (clearer errors)

---

## 3. Server Action Wrapper

Create a shared wrapper for consistent error handling across all server actions:

```typescript
// lib/server/action-wrapper.ts (or packages/core/src/server/action-wrapper.ts for monorepos)
export interface ServerActionSuccess<T> {
  success: true;
  data: T;
}

export interface ServerActionError {
  success: false;
  error: string;
  details?: string[];
}

export type ServerActionResponse<T> =
  | ServerActionSuccess<T>
  | ServerActionError;

export async function serverActionWrapper<T>(
  callback: () => Promise<T>
): Promise<ServerActionResponse<T>> {
  try {
    const data = await callback();
    return { success: true, data };
  } catch (error: any) {
    console.error("Server action error:", error);

    if (error.details && Array.isArray(error.details)) {
      return {
        success: false,
        error: error.message || "Validation failed",
        details: error.details,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Type guards
export function isSuccess<T>(
  response: ServerActionResponse<T>
): response is ServerActionSuccess<T> {
  return response.success === true;
}

export function isError<T>(
  response: ServerActionResponse<T>
): response is ServerActionError {
  return response.success === false;
}
```

### Client-Side Usage

```typescript
"use client";

import { createUser } from "@/server/actions/database/user";
import { isSuccess } from "@/lib/server/action-wrapper";

async function handleSubmit() {
  const result = await createUser(formData);

  if (isSuccess(result)) {
    toast.success("User created!");
    router.push(`/users/${result.data.id}`);
  } else {
    toast.error(result.error);
    if (result.details) {
      result.details.forEach((d) => console.error(d));
    }
  }
}
```

---

## 4. Model Definitions

### Basic Model

```typescript
// lib/models/User.ts
import mongoose, { Schema, model, models, Model } from "mongoose";

// 1. TypeScript interface
export interface IUser {
  _id?: Schema.Types.ObjectId;
  email: string;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Mongoose schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      trim: true,
    },
  },
  { timestamps: true }
);

// 3. Export with recompilation prevention (CRITICAL!)
const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);

export default User;
```

### Model with References

```typescript
// lib/models/Event.ts
import mongoose, { Schema, model, models, Model } from "mongoose";

export interface IEvent {
  _id?: Schema.Types.ObjectId;
  eventAdminId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  status: "Regular" | "Cancelled";
  when: Date;
  where: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    eventAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event admin is required"],
    },
    name: {
      type: String,
      required: [true, "Event name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Regular", "Cancelled"],
        message: "Status must be Regular or Cancelled",
      },
      default: "Regular",
    },
    when: {
      type: Date,
      required: [true, "Event date is required"],
    },
    where: {
      type: String,
      required: [true, "Location is required"],
      maxlength: [200, "Location cannot exceed 200 characters"],
      trim: true,
    },
  },
  { timestamps: true }
);

const Event: Model<IEvent> =
  (models.Event as Model<IEvent>) || model<IEvent>("Event", EventSchema);

export default Event;
```

### Model with Indexes

```typescript
// lib/models/Job.ts
import mongoose, { Schema, model, models, Model } from "mongoose";

export interface IJob {
  _id?: Schema.Types.ObjectId;
  title: string;
  minSalary?: number;
  maxSalary?: number;
  salaryBase?: "h" | "month" | "year";
  url: string;
  stack: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      trim: true,
    },
    minSalary: { type: Number, min: [0, "Salary cannot be negative"] },
    maxSalary: { type: Number, min: [0, "Salary cannot be negative"] },
    salaryBase: {
      type: String,
      enum: { values: ["h", "month", "year"], message: "Invalid salary base" },
    },
    url: { type: String, required: [true, "URL is required"], trim: true },
    stack: [{ type: Schema.Types.ObjectId, ref: "Stack" }],
  },
  { timestamps: true }
);

// Indexes for query optimization
JobSchema.index({ createdAt: -1 }); // Sort by newest
JobSchema.index({ stack: 1 }); // Filter by tech stack
JobSchema.index({ title: "text" }); // Full-text search

const Job: Model<IJob> =
  (models.Job as Model<IJob>) || model<IJob>("Job", JobSchema);

export default Job;
```

### Index Types Reference

| Type | Use Case | Example |
|------|----------|---------|
| Single field | Simple queries | `{ email: 1 }` |
| Compound | Multiple field filters | `{ eventId: 1, status: 1 }` |
| Unique | Prevent duplicates | `unique: true` in schema |
| Sparse | Optional unique fields | `{ sparse: true }` |
| Text | Full-text search | `{ title: "text" }` |
| Collation | Case-insensitive | `{ collation: { locale: "en", strength: 2 } }` |

---

## 5. Server Actions (CRUD)

### File Structure

```
server/actions/database/
├── user.ts
├── event.ts
├── participant.ts
└── event-page.ts    # Compound queries
```

### Create

```typescript
// server/actions/database/user.ts
"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { serverActionWrapper, ServerActionResponse } from "@/lib/server/action-wrapper";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/User";

export interface CreateUserData {
  email: string;
  username: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

export async function createUser(
  data: CreateUserData
): Promise<ServerActionResponse<UserResponse>> {
  return serverActionWrapper(async () => {
    await connectDB();

    // Validate required fields
    if (!data.email || !data.username) {
      throw new Error("Email and username are required");
    }

    try {
      const user = await User.create({
        email: data.email,
        username: data.username,
      });

      revalidatePath("/users");

      return {
        id: user._id!.toString(),
        email: user.email,
        username: user.username,
        createdAt: user.createdAt?.toISOString(),
      };
    } catch (error: any) {
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`A user with this ${field} already exists`);
      }

      // Handle validation errors
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
  });
}
```

### Read

```typescript
export async function getUserById(
  id: string
): Promise<ServerActionResponse<UserResponse>> {
  return serverActionWrapper(async () => {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID");
    }

    await connectDB();

    const user = await User.findById(id).select("-__v").lean();

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id!.toString(),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt?.toISOString(),
    };
  });
}

export async function getUserByEmail(
  email: string
): Promise<ServerActionResponse<UserResponse | null>> {
  return serverActionWrapper(async () => {
    await connectDB();

    const user = await User.findOne({ email }).lean();

    if (!user) {
      return null;
    }

    return {
      id: user._id!.toString(),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt?.toISOString(),
    };
  });
}
```

### Update

```typescript
export interface UpdateUserData {
  username?: string;
}

export async function updateUser(
  id: string,
  data: UpdateUserData
): Promise<ServerActionResponse<UserResponse>> {
  return serverActionWrapper(async () => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID");
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      id,
      { ...(data.username && { username: data.username }) },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    revalidatePath("/users");
    revalidatePath(`/users/${id}`);

    return {
      id: user._id!.toString(),
      email: user.email,
      username: user.username,
      createdAt: user.createdAt?.toISOString(),
    };
  });
}
```

### Delete

```typescript
export async function deleteUser(
  id: string
): Promise<ServerActionResponse<{ deleted: boolean }>> {
  return serverActionWrapper(async () => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID");
    }

    await connectDB();

    const result = await User.findByIdAndDelete(id);

    if (!result) {
      throw new Error("User not found");
    }

    revalidatePath("/users");

    return { deleted: true };
  });
}
```

---

## 6. Query Patterns

### Basic Queries

```typescript
// Find all
const users = await User.find({});

// Find with filter
const activeEvents = await Event.find({ status: "Regular" });

// Find one
const user = await User.findOne({ email: "user@example.com" });

// Find by ID
const event = await Event.findById(eventId);

// Sort and limit
const recentEvents = await Event.find({}).sort({ createdAt: -1 }).limit(10);
```

### Lean Queries (Read-Only Performance)

Use `.lean()` for read-only operations (~25-50% faster):

```typescript
// Returns plain JavaScript objects (faster)
const events = await Event.find({ eventAdminId }).lean();

// Use when:
// - Display-only data
// - Data passed to Client Components
// - Large result sets

// Don't use when:
// - You need to call .save() on the result
// - You need Mongoose virtuals/getters
```

### Population (Joins)

```typescript
// Single reference
const job = await Job.findById(jobId).populate("stack");

// With field selection
const job = await Job.findById(jobId).populate("stack", "name logo");

// Multiple references
const evaluation = await Evaluation.findById(evalId)
  .populate("meetId", "name")
  .populate("participantId", "email username");
```

### Pagination

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
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

    const [jobs, total] = await Promise.all([
      Job.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("stack", "name logo")
        .select("-__v")
        .lean(),
      Job.countDocuments({}),
    ]);

    return {
      items: jobs.map((job) => ({
        id: job._id!.toString(),
        title: job.title,
        // ... other fields
      })),
      total,
      page,
      pageSize,
      hasMore: skip + jobs.length < total,
    };
  });
}
```

### Compound Queries (Page Data)

Fetch all data for a page in a single round-trip:

```typescript
// server/actions/database/event-page.ts
export async function getEventPageData(
  eventId: string
): Promise<ServerActionResponse<EventPageData>> {
  return serverActionWrapper(async () => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }

    await connectDB();

    // Parallel queries
    const [event, participants, payments] = await Promise.all([
      Event.findById(eventId).lean(),
      Participant.find({ eventId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ eventId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!event) {
      throw new Error("Event not found");
    }

    // Serialize for Client Components
    return JSON.parse(
      JSON.stringify({
        event,
        participants,
        payments,
      })
    );
  });
}
```

### Serialization for Client Components

MongoDB documents contain `ObjectId` and `Date` that can't pass to Client Components:

```typescript
// Option 1: JSON parse/stringify
return JSON.parse(JSON.stringify(data));

// Option 2: Manual conversion
return {
  id: doc._id!.toString(),
  createdAt: doc.createdAt?.toISOString(),
  // ...
};
```

---

## 7. Authorization

### Basic Pattern

```typescript
export async function updateEvent(
  eventId: string,
  data: UpdateEventData
): Promise<ServerActionResponse<{ id: string }>> {
  return serverActionWrapper(async () => {
    // 1. Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    // 2. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }

    await connectDB();

    // 3. Get current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new Error("User not found");
    }

    // 4. Get resource and verify ownership
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.eventAdminId.toString() !== user._id!.toString()) {
      throw new Error("Forbidden: You don't own this event");
    }

    // 5. Safe to proceed
    const updated = await Event.findByIdAndUpdate(
      eventId,
      { ...data },
      { new: true, runValidators: true }
    );

    revalidatePath(`/events/${eventId}`);

    return { id: updated!._id!.toString() };
  });
}
```

### Reusable Authorization Helper

```typescript
// lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import Event, { IEvent } from "@/lib/models/Event";

export async function requireAuth(): Promise<IUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function requireEventOwner(
  eventId: string
): Promise<{ user: IUser; event: IEvent }> {
  const user = await requireAuth();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.eventAdminId.toString() !== user._id!.toString()) {
    throw new Error("Forbidden");
  }

  return { user, event };
}

// Usage in server action
export async function updateEventName(eventId: string, newName: string) {
  return serverActionWrapper(async () => {
    const { event } = await requireEventOwner(eventId);

    event.name = newName;
    await event.save();

    revalidatePath(`/events/${eventId}`);
    return { id: event._id!.toString() };
  });
}
```

---

## 8. Validation

### Schema-Level Validation

```typescript
const EventSchema = new Schema<IEvent>({
  // Required with custom message
  name: {
    type: String,
    required: [true, "Event name is required"],
  },

  // String length
  description: {
    type: String,
    minlength: [10, "Description must be at least 10 characters"],
    maxlength: [500, "Description cannot exceed 500 characters"],
  },

  // Number range
  rating: {
    type: Number,
    min: [0, "Rating cannot be negative"],
    max: [10, "Rating cannot exceed 10"],
  },

  // Enum
  status: {
    type: String,
    enum: {
      values: ["pending", "active", "completed"],
      message: "Status must be pending, active, or completed",
    },
  },

  // Regex
  email: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },

  // Custom validator
  extraGuests: {
    type: [String],
    default: [],
    validate: {
      validator: function (guests: string[]) {
        return guests.length <= 50;
      },
      message: "Cannot exceed 50 extra guests",
    },
  },
});
```

### Server Action Validation

```typescript
export async function createEvent(data: CreateEventData) {
  return serverActionWrapper(async () => {
    // Required fields
    if (!data.name?.trim()) {
      throw new Error("Event name is required");
    }

    // Length validation
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

    await connectDB();

    try {
      const event = await Event.create({
        ...data,
        name: data.name.trim(),
      });

      return { id: event._id!.toString() };
    } catch (error: any) {
      // Duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`A record with this ${field} already exists`);
      }

      // Mongoose validation error
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
  });
}
```

---

## 9. Advanced Patterns

### Soft Delete

Instead of permanently deleting, use a status field:

```typescript
// Schema
status: {
  type: String,
  enum: ["Regular", "Cancelled"],
  default: "Regular",
}

// "Delete" (soft)
export async function cancelEvent(eventId: string) {
  return serverActionWrapper(async () => {
    await connectDB();
    await Event.findByIdAndUpdate(eventId, { status: "Cancelled" });
    return { success: true };
  });
}

// Restore
export async function restoreEvent(eventId: string) {
  return serverActionWrapper(async () => {
    await connectDB();
    await Event.findByIdAndUpdate(eventId, { status: "Regular" });
    return { success: true };
  });
}

// Query active only
const activeEvents = await Event.find({ status: "Regular" });
```

### Case-Insensitive Unique Fields

```typescript
const StackSchema = new Schema<IStack>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Case-insensitive index
StackSchema.index(
  { name: 1 },
  { collation: { locale: "en", strength: 2 } }
);
```

### Sparse Indexes (Optional Unique)

```typescript
// Only index documents where field exists
stripeCustomerId: {
  type: String,
  unique: true,
  sparse: true,
}

Schema.index({ stripeCustomerId: 1 }, { sparse: true });
```

### Text Search

```typescript
// Enable text index
JobSchema.index({ title: "text", description: "text" });

// Search
export async function searchJobs(query: string) {
  return serverActionWrapper(async () => {
    await connectDB();

    const jobs = await Job.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(20);

    return jobs;
  });
}
```

### Compound Unique Index

```typescript
// One evaluation per participant per meet
EvaluationSchema.index(
  { meetId: 1, participantId: 1 },
  { unique: true }
);

// One nickname per user pair
UserNicknameSchema.index(
  { creatorId: 1, targetUserId: 1 },
  { unique: true }
);
```

---

## 10. Middleware Integration

Using MongoDB in Next.js middleware requires Node.js runtime:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "nodejs", // Required for Mongoose (not Edge Runtime)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

export async function middleware(request: NextRequest) {
  // Dynamic imports to avoid Edge Runtime issues
  const { getToken } = await import("next-auth/jwt");
  const { default: connectDB } = await import("@/lib/db");
  const { default: User } = await import("@/lib/models/User");

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.email) {
    try {
      await connectDB();
      const user = await User.findOne({ email: token.email });

      if (!user) {
        return NextResponse.redirect(new URL("/register", request.url));
      }
    } catch (error) {
      console.error("Middleware DB error:", error);
      // Don't block request on error
    }
  }

  return NextResponse.next();
}
```

---

## 11. Troubleshooting

### "Cannot overwrite model once compiled"

**Cause**: Model defined without checking `models` registry.

```typescript
// WRONG
const User = model("User", UserSchema);

// CORRECT
const User = models.User || model("User", UserSchema);
```

### "Operation buffered timed out"

**Cause**: Connection not established before query.

```typescript
// Always connect first
await connectDB();
const users = await User.find({});
```

### "Cannot read properties of undefined (reading 'ObjectId')"

**Cause**: Using mongoose before importing.

```typescript
import mongoose from "mongoose";

if (!mongoose.Types.ObjectId.isValid(id)) {
  throw new Error("Invalid ID");
}
```

### Connection pool exhausted

**Cause**: New connections on every hot reload.

**Fix**: Use the connection caching pattern in `lib/db.ts`.

### "E11000 duplicate key error"

**Fix**: Handle in server action:

```typescript
try {
  await User.create(data);
} catch (error: any) {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    throw new Error(`A user with this ${field} already exists`);
  }
  throw error;
}
```

### Performance Tips

1. Use `.lean()` for read-only queries
2. Create indexes for frequently queried fields
3. Use `Promise.all()` for independent queries
4. Select only needed fields: `.select("name email")`
5. Paginate large result sets

---

## 12. Quick Reference

### Project Structure

```
lib/
  db.ts                      # Connection caching
  models/
    User.ts
    Event.ts
    ...
  server/
    action-wrapper.ts        # Error handling wrapper
  auth-helpers.ts            # Authorization helpers
server/
  actions/
    database/
      user.ts
      event.ts
      ...
```

### Model Template

```typescript
import mongoose, { Schema, model, models, Model } from "mongoose";

export interface IModelName {
  _id?: Schema.Types.ObjectId;
  // fields...
  createdAt?: Date;
  updatedAt?: Date;
}

const ModelNameSchema = new Schema<IModelName>(
  {
    // field definitions...
  },
  { timestamps: true }
);

// Optional indexes
ModelNameSchema.index({ field: 1 });

const ModelName: Model<IModelName> =
  (models.ModelName as Model<IModelName>) ||
  model<IModelName>("ModelName", ModelNameSchema);

export default ModelName;
```

### Server Action Template

```typescript
"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { serverActionWrapper, ServerActionResponse } from "@/lib/server/action-wrapper";
import connectDB from "@/lib/db";
import Model from "@/lib/models/Model";

export async function actionName(
  data: InputType
): Promise<ServerActionResponse<OutputType>> {
  return serverActionWrapper(async () => {
    await connectDB();

    // Validation...
    // Authorization...
    // Database operation...

    revalidatePath("/path");
    return result;
  });
}
```

### Checklist for New Server Actions

- [ ] Add `"use server"` directive
- [ ] Use `serverActionWrapper`
- [ ] Call `await connectDB()` first
- [ ] Validate ObjectId format
- [ ] Add authorization check
- [ ] Handle validation errors
- [ ] Handle duplicate key errors (11000)
- [ ] Normalize response (ObjectIds to strings)
- [ ] Call `revalidatePath()` after mutations
- [ ] Define TypeScript interfaces
