# Dark Mode Setup Guide (Next.js + next-themes)

This guide shows how to set up dark mode in a Next.js project using `next-themes`, with automatic system preference detection.

**Reference Implementation:** `apps/ratata` in this repository.

## Prerequisites

- Next.js 13+ with App Router
- React 18+
- Tailwind CSS (optional but recommended)

## Installation Steps

### 1. Install next-themes

```bash
# For a standalone project
npm install next-themes

# For a Turborepo workspace
yarn workspace <app-name> add next-themes
```

### 2. Create Theme Provider

Create `components/providers/theme-provider.tsx`:

```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Important:** This must be a Client Component (`"use client"`).

### 3. Update Root Layout

Update `app/layout.tsx`:

```typescript
import { ThemeProvider } from "@/components/providers/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Key Props:**
- `attribute="class"` - Adds `.dark` class to `<html>` element
- `defaultTheme="system"` - Uses system preference by default
- `enableSystem` - Enables system theme detection
- `disableTransitionOnChange` - Prevents flash during theme switch
- `suppressHydrationWarning` - Required on `<html>` to prevent hydration warnings

### 4. Define Dark Mode Styles

#### With Tailwind CSS v4 (@theme directive)

In `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Light mode colors */
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(9% 0 0);
  /* ... other colors */
}

.dark {
  /* Dark mode colors */
  --color-background: oklch(9% 0 0);
  --color-foreground: oklch(98% 0 0);
  /* ... other colors */
}

@layer base {
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

#### With Tailwind CSS v3 (CSS variables)

In `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    /* ... other colors */
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... other colors */
  }
}
```

Then configure in `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  // ... rest of config
}
export default config
```

### 5. Create Theme Toggle (Optional)

Create `components/theme-toggle.tsx`:

```typescript
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Note:** Requires shadcn/ui `button` and `dropdown-menu` components, or build your own toggle.

### 6. Usage

The theme will automatically:
- Detect user's system preference (light/dark)
- Apply the appropriate theme on initial load
- Remember user's choice in localStorage
- Update when system preference changes

To manually control theme in your components:

```typescript
"use client"

import { useTheme } from "next-themes"

export function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("system")}>System</button>
    </div>
  )
}
```

## How It Works

1. **System Detection:** `next-themes` detects the user's system preference via `prefers-color-scheme` media query
2. **Class Application:** Adds/removes `.dark` class to `<html>` element based on theme
3. **Persistence:** Saves user preference to localStorage
4. **SSR Handling:** Uses `suppressHydrationWarning` to prevent mismatch between server and client

## Important Notes

### Avoiding Hydration Errors

Always add `suppressHydrationWarning` to the `<html>` element to prevent React hydration warnings, as the theme is applied client-side.

### Using with Server Components

The `ThemeProvider` is a Client Component, but your layout can still be a Server Component. The provider only wraps the children.

### Theme Persistence

The theme choice is stored in localStorage under the key `theme` by default. Users' preferences will persist across sessions.

## Troubleshooting

### Flash of wrong theme on page load

Set `disableTransitionOnChange` prop to prevent CSS transitions during theme changes.

### Theme not applying

1. Verify `.dark` class selector in your CSS
2. Check `darkMode: ["class"]` in Tailwind config (v3)
3. Ensure `attribute="class"` in ThemeProvider

### Hydration warnings

Add `suppressHydrationWarning` to `<html>` element.

## Resources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [shadcn/ui Dark Mode Guide](https://ui.shadcn.com/docs/dark-mode/next)
