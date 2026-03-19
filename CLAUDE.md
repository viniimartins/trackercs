# CLAUDE.md

## Frontend

Ao trabalhar no frontend (`web/`), siga os patterns definidos em `web/.agents/patterns.md`.

## Backend

Ao trabalhar na API (`api/`), siga os patterns definidos em `api/.agents/patterns.md`.

## useEffect Policy

**Raw `useEffect` is banned** in component and page files (`src/components/`, `src/app/`). Instead:

1. **Use a custom hook** from `src/hooks/`: `useMountEffect`, `useClickOutside`, `useOverlayLock`, `useCanScroll`
2. **Extract a new hook** into `src/hooks/` if none of the above fit
3. **Tag as audited** (`// effect:audited — <reason>` above the call + ESLint disable on the import) only when the effect is truly unique

Files in `src/hooks/` and `_hooks/` directories are exempt. See `web/.agents/patterns.md` section 18 for full details.
