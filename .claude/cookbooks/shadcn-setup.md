# shadcn/ui Setup Guide

This guide shows how to set up shadcn/ui in a Next.js project with Tailwind CSS v4.

**Reference Implementation:** `apps/ratata` in this repository.

## Prerequisites

- Next.js 16+ with App Router
- Tailwind CSS 4+
- TypeScript

## Installation Steps

### 1. Add TypeScript Path Alias

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 2. Install Dependencies

```bash
# For a standalone project
npm install class-variance-authority clsx tailwind-merge

# For a Turborepo workspace
yarn workspace <app-name> add class-variance-authority clsx tailwind-merge
```

### 3. Create components.json

Create `components.json` in your project root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 4. Create Utility Helper

Create `lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5. Configure Tailwind CSS v4 Theme

Update `app/globals.css` with Tailwind v4's `@theme` syntax:

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(9% 0 0);
  --color-card: oklch(100% 0 0);
  --color-card-foreground: oklch(9% 0 0);
  --color-popover: oklch(100% 0 0);
  --color-popover-foreground: oklch(9% 0 0);
  --color-primary: oklch(9% 0 0);
  --color-primary-foreground: oklch(98% 0 0);
  --color-secondary: oklch(96.1% 0 0);
  --color-secondary-foreground: oklch(9% 0 0);
  --color-muted: oklch(96.1% 0 0);
  --color-muted-foreground: oklch(45.1% 0 0);
  --color-accent: oklch(96.1% 0 0);
  --color-accent-foreground: oklch(9% 0 0);
  --color-destructive: oklch(60.2% 0.2 27);
  --color-destructive-foreground: oklch(98% 0 0);
  --color-border: oklch(89.8% 0 0);
  --color-input: oklch(89.8% 0 0);
  --color-ring: oklch(9% 0 0);
  --radius-lg: 0.5rem;
  --radius-md: calc(var(--radius-lg) - 2px);
  --radius-sm: calc(var(--radius-lg) - 4px);
}

.dark {
  --color-background: oklch(9% 0 0);
  --color-foreground: oklch(98% 0 0);
  --color-card: oklch(9% 0 0);
  --color-card-foreground: oklch(98% 0 0);
  --color-popover: oklch(9% 0 0);
  --color-popover-foreground: oklch(98% 0 0);
  --color-primary: oklch(98% 0 0);
  --color-primary-foreground: oklch(9% 0 0);
  --color-secondary: oklch(14.9% 0 0);
  --color-secondary-foreground: oklch(98% 0 0);
  --color-muted: oklch(14.9% 0 0);
  --color-muted-foreground: oklch(63.9% 0 0);
  --color-accent: oklch(14.9% 0 0);
  --color-accent-foreground: oklch(98% 0 0);
  --color-destructive: oklch(30.6% 0.17 27);
  --color-destructive-foreground: oklch(98% 0 0);
  --color-border: oklch(14.9% 0 0);
  --color-input: oklch(14.9% 0 0);
  --color-ring: oklch(83.1% 0 0);
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

### 6. Add Components

Use the shadcn CLI to add components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
# Add any other components you need
```

Components will be installed to `components/ui/`.

### 7. Usage

Import and use components:

```tsx
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div>
      <Button>Click me</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  )
}
```

## Important Notes

### Tailwind v4 Compatibility

- Use `@theme` directive instead of CSS variables in `:root`
- Use OKLCH color space for better color interpolation
- Color variables use `--color-*` prefix (e.g., `--color-primary`)
- Apply colors using standard Tailwind utilities (e.g., `bg-primary`, `text-foreground`)

### Per-Project Approach

shadcn/ui is designed to be copied into your project, not installed as a package. This gives you:
- Full control over component code
- Easy customization per project
- No dependency management between projects

Each app/project should have its own shadcn setup, not shared across a monorepo.

## Troubleshooting

### "Cannot apply unknown utility class" errors

Make sure your `globals.css` uses the `@theme` directive and defines colors with the `--color-*` prefix for Tailwind v4.

### Import path errors

Verify that your `tsconfig.json` has the `@/*` path alias configured correctly.

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
