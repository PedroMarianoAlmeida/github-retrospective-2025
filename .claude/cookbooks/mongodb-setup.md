# MongoDB Setup Cookbook

Complete guide for setting up MongoDB with Mongoose in Next.js applications. Based on production patterns from `ratata` and `usd-latam-jobs` apps.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Connection](#database-connection)
3. [Model Definitions](#model-definitions)
4. [Server Actions](#server-actions)
5. [Query Patterns](#query-patterns)
6. [Validation Patterns](#validation-patterns)
7. [Advanced Patterns](#advanced-patterns)
8. [Middleware Integration](#middleware-integration)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Install Dependencies

```bash
yarn workspace <app-name> add mongoose
```

### Environment Variables

Add to your `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

---

## Database Connection

Create `lib/db.ts` with the connection caching pattern to prevent connection pool exhaustion during Next.js hot reload:

```typescript
// lib/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Cache structure for connection reuse
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global to persist cache across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if not exists
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false, // Fail fast on connection issues
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

1. **Hot Reload Protection**: Next.js re-executes module code on hot reload; caching prevents multiple connections
2. **Promise Caching**: Prevents race conditions when multiple components connect simultaneously
3. **Buffer Commands Disabled**: Queries fail immediately if not connected (better error messages)
4. **Global Cache**: Persists across module re-evaluations in development

---

## Model Definitions

### Basic Model Structure

```typescript
// lib/models/User.ts
import mongoose, { Schema, model, models, Model } from "mongoose";

// 1. Define TypeScript interface
export interface IUser {
  _id?: Schema.Types.ObjectId;
  email: string;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Create Mongoose schema
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
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

// 3. Export with recompilation prevention
const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);

export default User;
```

### Recompilation Prevention Pattern

**Critical**: Always use this pattern to prevent Mongoose model recompilation errors:

```typescript
// ✅ CORRECT - Check models registry first
const Model: Model<IInterface> =
  (models.ModelName as Model<IInterface>) ||
  model<IInterface>("ModelName", Schema);

// ❌ WRONG - Will throw "Cannot overwrite model" error on hot reload
const Model = model<IInterface>("ModelName", Schema);
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
  {
    timestamps: true,
  }
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
    minSalary: {
      type: Number,
      min: [0, "Salary cannot be negative"],
    },
    maxSalary: {
      type: Number,
      min: [0, "Salary cannot be negative"],
    },
    salaryBase: {
      type: String,
      enum: {
        values: ["h", "month", "year"],
        message: "Salary base must be h, month, or year",
      },
    },
    url: {
      type: String,
      required: [true, "Application URL is required"],
      trim: true,
    },
    stack: [
      {
        type: Schema.Types.ObjectId,
        ref: "Stack",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for query optimization
JobSchema.index({ createdAt: -1 }); // Sort by newest
JobSchema.index({ stack: 1 }); // Filter by tech stack
JobSchema.index({ title: "text" }); // Full-text search

const Job: Model<IJob> =
  (models.Job as Model<IJob>) || model<IJob>("Job", JobSchema);

export default Job;
```

### Index Types

| Index Type | Use Case | Example |
|------------|----------|---------|
| Single field | Simple queries | `{ email: 1 }` |
| Compound | Multiple field filters | `{ eventId: 1, status: 1 }` |
| Unique | Prevent duplicates | `{ unique: true }` |
| Sparse | Optional unique fields | `{ sparse: true }` |
| Text | Full-text search | `{ title: "text" }` |
| Collation | Case-insensitive | `{ collation: { locale: "en", strength: 2 } }` |

---

## Server Actions

### Server Action Wrapper

Use `@repo/core/server` for consistent error handling:

```typescript
// packages/core/src/server/action-wrapper.ts
export interface ServerActionSuccess<T> {
  success: true;
  data: T;
}

export interface ServerActionError {
  success: false;
  error: string;
  details?: string[]; // For validation errors
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

    // Handle validation errors with details
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

// Type guard for checking success
export function isSuccess<T>(
  response: ServerActionResponse<T>
): response is ServerActionSuccess<T> {
  return response.success === true;
}
```

### Basic Server Action Pattern

```typescript
// server/actions/database/user.ts
"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import {
  serverActionWrapper,
  ServerActionResponse,
} from "@repo/core/server";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/User";

// Response interface (what clients receive)
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  createdAt?: string;
}

// Request interface (what clients send)
export interface CreateUserData {
  email: string;
  username: string;
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

### Server Action with Authorization

```typescript
// server/actions/database/event.ts
"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import {
  serverActionWrapper,
  ServerActionResponse,
} from "@repo/core/server";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Event, { IEvent } from "@/lib/models/Event";

export interface UpdateEventData {
  name?: string;
  description?: string;
  when?: string;
  where?: string;
}

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

    // 2. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }

    await connectDB();

    // 3. Get current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new Error("User not found");
    }

    // 4. Get event and verify ownership
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.eventAdminId.toString() !== user._id!.toString()) {
      throw new Error("Forbidden: You don't own this event");
    }

    // 5. Safe to proceed with update
    const updated = await Event.findByIdAndUpdate(
      eventId,
      {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.when && { when: new Date(data.when) }),
        ...(data.where && { where: data.where }),
      },
      { new: true, runValidators: true }
    );

    // 6. Revalidate affected paths
    revalidatePath(`/auth/event-details/${eventId}`);
    revalidatePath("/auth/dashboard");

    return { id: updated!._id!.toString() };
  });
}
```

---

## Query Patterns

### Basic Queries

```typescript
// Find all with filter
const events = await Event.find({ status: "Regular" });

// Find one
const user = await User.findOne({ email: "user@example.com" });

// Find by ID
const event = await Event.findById(eventId);

// Find with sort and limit
const recentEvents = await Event.find({})
  .sort({ createdAt: -1 })
  .limit(10);
```

### Lean Queries (Read-Only Performance)

Use `.lean()` for read-only operations to skip Mongoose document hydration:

```typescript
// ✅ Returns plain JavaScript objects (~25-50% faster)
const events = await Event.find({ eventAdminId }).lean();

// ❌ Returns Mongoose documents (slower for read-only)
const events = await Event.find({ eventAdminId });
```

**When to use `.lean()`**:
- Display-only data (lists, dashboards)
- Data passed to Client Components
- Large result sets

**When NOT to use `.lean()`**:
- When you need to call `.save()` on the result
- When you need Mongoose virtuals or getters

### Population (Joins)

```typescript
// Populate single reference
const job = await Job.findById(jobId).populate("stack");

// Populate with field selection
const job = await Job.findById(jobId).populate("stack", "name logo");

// Populate multiple references
const evaluation = await Evaluation.findById(evalId)
  .populate("meetId", "name")
  .populate("participantId", "email username")
  .populate("eventAdminId", "email");
```

### Pagination Pattern

```typescript
export async function getJobs(
  page: number = 1
): Promise<ServerActionResponse<JobsResponse>> {
  return serverActionWrapper(async () => {
    await connectDB();

    const PAGE_SIZE = 10;
    const skip = (page - 1) * PAGE_SIZE;

    const [jobs, total] = await Promise.all([
      Job.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .populate("stack", "name logo")
        .select("-__v")
        .lean(),
      Job.countDocuments({}),
    ]);

    const hasMore = skip + jobs.length < total;

    return {
      jobs: jobs.map((job) => ({
        id: job._id!.toString(),
        title: job.title,
        // ... serialize other fields
      })),
      nextCursor: hasMore ? page + 1 : null,
      total,
    };
  });
}
```

### Optimized Compound Queries

Fetch related data in a single round-trip:

```typescript
export async function getEventAdminPageData(
  eventId: string
): Promise<ServerActionResponse<EventPageData>> {
  return serverActionWrapper(async () => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }

    await connectDB();

    // Parallel queries for all page data
    const [event, participants, payments] = await Promise.all([
      Event.findById(eventId).lean(),
      Participant.find({ eventId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ eventId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!event) {
      throw new Error("Event not found");
    }

    // Serialize and return
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

MongoDB documents contain `ObjectId` and `Date` objects that can't be passed directly to Client Components. Always serialize:

```typescript
// ✅ CORRECT - Serialize before returning
return JSON.parse(JSON.stringify(data));

// Or manually convert
return {
  id: doc._id!.toString(),
  createdAt: doc.createdAt?.toISOString(),
  // ...
};
```

---

## Validation Patterns

### Schema-Level Validation

```typescript
const EventSchema = new Schema<IEvent>({
  // Required with custom message
  name: {
    type: String,
    required: [true, "Event name is required"],
  },

  // String length validation
  description: {
    type: String,
    minlength: [10, "Description must be at least 10 characters"],
    maxlength: [500, "Description cannot exceed 500 characters"],
  },

  // Number range validation
  rating: {
    type: Number,
    min: [0, "Rating cannot be negative"],
    max: [10, "Rating cannot exceed 10"],
  },

  // Enum validation
  status: {
    type: String,
    enum: {
      values: ["pending", "active", "completed"],
      message: "Status must be pending, active, or completed",
    },
  },

  // Regex validation
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
export async function createEvent(
  data: CreateEventData
): Promise<ServerActionResponse<EventResponse>> {
  return serverActionWrapper(async () => {
    // 1. Required fields
    if (!data.name || !data.when || !data.where) {
      throw new Error("Name, date, and location are required");
    }

    // 2. ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(data.eventAdminId)) {
      throw new Error("Invalid user ID");
    }

    // 3. Business logic validation
    const eventDate = new Date(data.when);
    if (eventDate < new Date()) {
      throw new Error("Event date must be in the future");
    }

    await connectDB();

    try {
      const event = await Event.create(data);
      return { id: event._id!.toString() };
    } catch (error: any) {
      // 4. Handle Mongoose validation errors
      if (error.name === "ValidationError") {
        const details = Object.values(error.errors).map(
          (err: any) => err.message
        );
        const validationError: any = new Error("Validation failed");
        validationError.details = details;
        throw validationError;
      }

      // 5. Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`A record with this ${field} already exists`);
      }

      throw error;
    }
  });
}
```

---

## Advanced Patterns

### Soft Delete Pattern

Instead of permanently deleting records, use a status field:

```typescript
// Model definition
status: {
  type: String,
  enum: ["Regular", "Cancelled"],
  default: "Regular",
}

// "Delete" (actually soft delete)
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
      required: [true, "Stack name is required"],
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Case-insensitive index with collation
StackSchema.index(
  { name: 1 },
  { collation: { locale: "en", strength: 2 } }
);
```

### Sparse Indexes for Optional Unique Fields

```typescript
// For optional fields that should be unique when present
stripeCustomerId: {
  type: String,
  unique: true,
  sparse: true, // Only index documents with this field
}

SubscriptionSchema.index({ stripeCustomerId: 1 }, { sparse: true });
```

### Text Search

```typescript
// Enable text index
JobSchema.index({ title: "text", description: "text" });

// Search query
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

Ensure unique combinations:

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

## Middleware Integration

### Using MongoDB in Next.js Middleware

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
        // Redirect to registration
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

**Key Points**:
- Use `runtime: "nodejs"` (Mongoose doesn't work on Edge)
- Use dynamic imports for database code
- Always catch errors to prevent blocking requests

---

## Troubleshooting

### Common Errors

#### "Cannot overwrite model once compiled"

**Cause**: Model defined without checking `models` registry.

**Fix**:
```typescript
// ✅ CORRECT
const User = models.User || model("User", UserSchema);

// ❌ WRONG
const User = model("User", UserSchema);
```

#### "MongooseError: Operation buffered timed out"

**Cause**: Connection not established before query.

**Fix**: Always call `await connectDB()` before queries:
```typescript
export async function getUsers() {
  await connectDB(); // Don't forget this!
  return User.find({});
}
```

#### "Cannot read properties of undefined (reading 'ObjectId')"

**Cause**: Using `mongoose.Types.ObjectId` before importing mongoose.

**Fix**:
```typescript
import mongoose from "mongoose";

if (!mongoose.Types.ObjectId.isValid(id)) {
  throw new Error("Invalid ID");
}
```

#### Connection pool exhausted in development

**Cause**: New connections created on every hot reload.

**Fix**: Use the connection caching pattern in `lib/db.ts` (see [Database Connection](#database-connection)).

#### "E11000 duplicate key error"

**Cause**: Inserting document with duplicate unique field.

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

1. **Use `.lean()` for read-only queries** - 25-50% faster
2. **Create indexes for frequently queried fields** - especially sort and filter fields
3. **Use `Promise.all()` for independent queries** - parallel execution
4. **Select only needed fields** - `.select("name email")` or `.select("-__v")`
5. **Paginate large result sets** - use `.skip()` and `.limit()`
6. **Use compound queries** - fetch related data in single round-trip

---

## Quick Reference

### File Structure

```
lib/
  db.ts                    # Connection with caching
  models/
    User.ts                # User model
    Event.ts               # Event model
    ...
server/
  actions/
    database/
      user.ts              # User CRUD actions
      event.ts             # Event CRUD actions
      ...
```

### Model Template

```typescript
import mongoose, { Schema, model, models, Model } from "mongoose";

export interface IModelName {
  _id?: Schema.Types.ObjectId;
  // ... fields
  createdAt?: Date;
  updatedAt?: Date;
}

const ModelNameSchema = new Schema<IModelName>(
  {
    // ... field definitions
  },
  { timestamps: true }
);

// Optional: Add indexes
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
import { serverActionWrapper, ServerActionResponse } from "@repo/core/server";
import connectDB from "@/lib/db";
import Model from "@/lib/models/Model";

export async function actionName(
  data: InputType
): Promise<ServerActionResponse<OutputType>> {
  return serverActionWrapper(async () => {
    await connectDB();
    // ... implementation
    revalidatePath("/path");
    return result;
  });
}
```
