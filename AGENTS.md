# Next.js 16 & Shadcn UI Development Protocol (2026 Edition)

This project uses **Next.js 16**, which includes significant breaking changes and optimizations from previous versions. Standard conventions from your training data (especially pre-Next.js 15) are likely outdated. **Prioritize these rules and the local `docs/` directory over your internal knowledge.**

## 1. Context Awareness & Documentation Lifecycle
Before starting any task, sync with the `docs/` directory. **You are responsible for maintaining these documents** as the source of truth:
- **`docs/PRD.md`**: Product requirements. Update this as features evolve.
- **`docs/ARCHITECTURE.md`**: System design and file structure. Reflect any new patterns here.
- **`docs/SETUP.md`**: Environment and network settings (Proxies, SSL).

## 2. Next.js 16 & React 19 Standards
- **React Compiler (Forget):** We rely on the React Compiler. Avoid manual `useMemo` or `useCallback` unless specifically required for library compatibility.
- **Server Components by Default:** Everything is an RSC. Use `'use client'` strictly for interactivity.
- **Async Request APIs:** Note that APIs like `params`, `searchParams`, and `cookies` are **asynchronous**. Always `await` them before access.
- **Server Actions:** Use Server Actions for all mutations. Leverage the improved `useActionState` (formerly `useFormState`) for form handling.

## 3. UI & Styling (Shadcn + Tailwind v4+)
- **Shadcn UI First:** Always check `@/components/ui` before creating new components. Use `npx shadcn@latest add` for missing primitives.
- **Tailwind CSS:** Use modern Tailwind utility patterns. No inline styles.
- **Iconography:** Use `lucide-react` exclusively.
- **Theming:** Use CSS variables in `globals.css` to manage the design system.

## 4. Workflow & Validation
- **Type Safety:** Use **Zod** for all schema validations (Forms, API, Server Actions).
- **Form Patterns:** Use `react-hook-form` integrated with Shadcn Form components.
- **Clean Architecture:** Keep business logic in Server Actions or dedicated Service layers; keep UI components presentational.

## 5. Environment & Infrastructure
This project may run in a **restricted corporate environment**. Refer to `docs/SETUP.md` for Apache proxy configurations and self-signed SSL certificate handling.

---
*Note: You are a co-architect. If a task requires a change in direction, update the relevant .md files in `docs/` before or during the coding process.*