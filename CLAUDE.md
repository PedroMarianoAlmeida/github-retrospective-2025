# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint (uses eslint-config-next with core-web-vitals and typescript)
```

## Architecture

This is a Next.js 16 App Router project using:
- **React 19** with Server Components by default
- **Tailwind CSS v4** with the new `@import "tailwindcss"` syntax and `@theme inline` for custom properties
- **TypeScript** in strict mode
- **Geist font** (sans and mono variants) loaded via `next/font/google`

### Path Aliases
`@/*` maps to the project root (configured in tsconfig.json)

### File Structure
- `app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with font configuration and global styles
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind and CSS custom properties for theming
