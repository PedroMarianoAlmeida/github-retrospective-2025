# Claude Code Cookbooks

This directory contains reusable setup guides and cookbooks that can be referenced across different projects.

## Purpose

These cookbooks provide step-by-step instructions for common development tasks and integrations. They are designed to be:

- **Reusable**: Can be applied to any project, not just this repository
- **Comprehensive**: Include all necessary steps, code snippets, and configurations
- **Reference-based**: Link to actual implementations in this repository when applicable

## Available Cookbooks

### [shadcn-setup.md](./cookbooks/shadcn-setup.md)
Complete guide for setting up shadcn/ui in a Next.js project with Tailwind CSS v4.

**Covers:**
- TypeScript configuration
- Component installation
- Tailwind v4 theme setup with OKLCH colors
- Usage examples and troubleshooting

**Reference:** `apps/ratata`

### [dark-mode-setup.md](./cookbooks/dark-mode-setup.md)
Complete guide for implementing dark mode using next-themes with system preference detection.

**Covers:**
- next-themes installation
- Theme provider setup
- Tailwind dark mode configuration
- Theme toggle component
- SSR considerations

**Reference:** `apps/ratata`

### [nextauth-setup.md](./cookbooks/nextauth-setup.md)
Complete guide for setting up authentication with NextAuth.js in Next.js App Router.

**Covers:**
- NextAuth installation
- OAuth provider setup (Google, GitHub)
- Credentials provider
- Session management
- Protected routes
- Database adapters

**Reference:** `apps/ratata`

## How to Use

1. **Reference in new projects**: Copy relevant sections to your new project's setup
2. **Share with AI assistants**: Point Claude Code or other AI tools to these guides when setting up similar features
3. **Update as needed**: Keep these cookbooks updated as best practices evolve

## Adding New Cookbooks

When creating new cookbooks:

1. Create a new `.md` file in the `cookbooks/` directory
2. Follow the existing structure:
   - Title and description
   - Reference implementation (if applicable)
   - Prerequisites
   - Step-by-step installation
   - Usage examples
   - Important notes
   - Troubleshooting
   - Resources
3. Update this README with the new cookbook

## Reference Implementations

The `apps/ratata` app in this repository serves as a complete reference implementation for:
- shadcn/ui setup
- Dark mode with next-themes
- NextAuth authentication

You can browse the source code to see working examples of these integrations.
