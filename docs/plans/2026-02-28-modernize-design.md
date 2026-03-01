# Modernização Visual — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize the app aesthetic with border-radius, shadows, glassmorphism nav, micro-animations and better visual feedback on interactive elements.

**Architecture:** Pure CSS/Tailwind changes — no logic changes, no new components (except replacing check-in table with card grid). Tokens added to `globals.css` first, then applied to components in dependency order.

**Tech Stack:** Next.js 16, Tailwind CSS 4 with `@theme inline`, CSS custom properties in `globals.css`.

---

> **Note on testing:** These are visual/CSS changes with no logic. There are no unit tests to write. Verification is: `npm run build` passes (TypeScript + Tailwind compile) + visual inspection in the browser.

---

### Task 1: CSS tokens + dialog animation keyframe (`app/globals.css`)

**Files:**
- Modify: `app/globals.css`

**What to do:**

Add to `:root` block (inside `@layer base`):
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

--shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);
```

Add to `.dark` block (inside `@layer base`):
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.30);
--shadow-md: 0 4px 12px rgba(0,0,0,0.40);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.50);
```

Add to `@theme inline` block:
```css
--radius-sm: var(--radius-sm);
--radius-md: var(--radius-md);
--radius-lg: var(--radius-lg);
--shadow-sm: var(--shadow-sm);
--shadow-md: var(--shadow-md);
--shadow-lg: var(--shadow-lg);
```

Add after `@layer utilities` block (new `@layer utilities` addition or append to existing):
```css
@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-dialog-enter {
  animation: dialog-enter 150ms ease-out forwards;
}
```

**Step 1: Apply changes to globals.css**

After applying, the file should have:
- `:root` with the 6 new vars (`--radius-sm/md/lg`, `--shadow-sm/md/lg` — light values)
- `.dark` with the 3 new shadow vars (dark values)
- `@theme inline` with the 6 new var references
- New `@keyframes dialog-enter` + `.animate-dialog-enter` utility class

**Step 2: Run build to verify**

```bash
cd C:/Users/User/poker-league && npm run build
```
Expected: BUILD SUCCESSFUL, no TypeScript or Tailwind errors.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add radius/shadow tokens and dialog-enter keyframe"
```

---

### Task 2: Nav Bar glassmorphism + scroll shadow (`components/nav-bar.tsx`)

**Files:**
- Modify: `components/nav-bar.tsx`

**What to do:**

1. Add `scrolled` state using `useState<boolean>(false)`.
2. Add scroll listener in `useEffect` (with cleanup): `scrollY > 10` → `setScrolled(true)`, else `setScrolled(false)`.
3. Change `<nav>` classes:
   - Before: `border-b-2 border-ink bg-canvas`
   - After: `sticky top-0 z-40 border-b border-border-strong bg-canvas/80 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-md" : "shadow-none"}`
4. Active link: add crimson bottom-bar via relative + `after:` pseudo-class. Change active link classes to:
   ```
   relative text-crimson
   after:absolute after:bottom-[-1px] after:left-0 after:h-0.5 after:w-full after:bg-crimson
   ```
   (The nav bar is `h-16` with `items-center`, so `after:bottom-[-1px]` puts the bar at the bottom edge of the nav.)

**Current `<nav>` tag (line 36):**
```tsx
<nav className="border-b-2 border-ink bg-canvas">
```

**New `<nav>` tag:**
```tsx
<nav className={`sticky top-0 z-40 border-b border-border-strong bg-canvas/80 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-[var(--shadow-md)]" : "shadow-none"}`}>
```

**Add after the existing imports / state declarations:**
```tsx
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

**Active link classes in desktop links (lines 54-57):**
```tsx
className={`relative font-body text-[11px] font-bold uppercase tracking-[2px] transition-colors ${
  isActive
    ? "text-crimson after:absolute after:bottom-[-1px] after:left-0 after:h-0.5 after:w-full after:bg-crimson"
    : "text-ink hover:text-crimson"
}`}
```

**Step 1: Apply all changes to nav-bar.tsx**

**Step 2: Run build**

```bash
cd C:/Users/User/poker-league && npm run build
```
Expected: BUILD SUCCESSFUL.

**Step 3: Commit**

```bash
git add components/nav-bar.tsx
git commit -m "feat: glassmorphism nav with scroll shadow and active link underline"
```

---

### Task 3: Confirm Dialog modernization (`components/confirm-dialog.tsx`)

**Files:**
- Modify: `components/confirm-dialog.tsx`

**What to do:**

1. Overlay: `bg-black/50` → `bg-black/40 backdrop-blur-sm`
2. Container: `border-2 border-ink bg-surface p-8` → `rounded-xl bg-surface p-8 shadow-[var(--shadow-lg)] animate-dialog-enter`
3. Confirm button: add `rounded-md shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]`
4. Cancel button: add `rounded-md transition-all duration-150 hover:-translate-y-0.5`

**Current overlay (line 48):**
```tsx
<div
  className="absolute inset-0 bg-black/50"
```
**New:**
```tsx
<div
  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
```

**Current container (line 52):**
```tsx
<div className="relative z-10 w-full max-w-sm border-2 border-ink bg-surface p-8">
```
**New:**
```tsx
<div className="relative z-10 w-full max-w-sm rounded-xl bg-surface p-8 shadow-[var(--shadow-lg)] animate-dialog-enter">
```

**Current confirm button (lines 60-65):**
```tsx
className="flex-1 bg-crimson px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828]"
```
**New:**
```tsx
className="flex-1 rounded-md bg-crimson px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)]"
```

**Current cancel button (lines 67-70):**
```tsx
className="flex-1 border-2 border-ink bg-transparent px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-ink transition-all hover:bg-ink hover:text-canvas"
```
**New:**
```tsx
className="flex-1 rounded-md border-2 border-ink bg-transparent px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-ink transition-all duration-150 hover:-translate-y-0.5 hover:bg-ink hover:text-canvas"
```

**Step 1: Apply all changes to confirm-dialog.tsx**

**Step 2: Run build**

```bash
cd C:/Users/User/poker-league && npm run build
```
Expected: BUILD SUCCESSFUL.

**Step 3: Commit**

```bash
git add components/confirm-dialog.tsx
git commit -m "feat: modernize confirm dialog with blur overlay, rounded corners and entrance animation"
```

---

### Task 4: Check-in Form — replace table with card grid (`components/check-in-form.tsx`)

**Files:**
- Modify: `components/check-in-form.tsx`

**What to do:**

Replace the entire `<div className="overflow-hidden border border-border-strong bg-surface">` block (the table) with a card grid. Keep all logic (state, handlers) untouched — only change the JSX rendering.

**Remove** (lines 72–111):
```tsx
<div className="overflow-hidden border border-border-strong bg-surface">
  <table className="min-w-full">
    <thead>...</thead>
    <tbody>
      {players.map((player) => {
        ...
        <tr key={player.id} ...>
          <td>...</td>
          <td>...</td>
        </tr>
      })}
    </tbody>
  </table>
</div>
```

**Replace with:**
```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
  {players.map((player) => {
    const isCheckedIn = checkedIn.has(player.id);
    const isLoading = loading === player.id;
    return (
      <div
        key={player.id}
        className={`flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors ${
          isCheckedIn
            ? "border-crimson/30 bg-tint-crimson"
            : "border-border-subtle bg-surface hover:border-crimson/20"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isCheckedIn ? "bg-crimson" : "bg-panel"
          }`}
        >
          <span className="font-heading text-sm font-bold text-white">
            {getInitials(player.name)}
          </span>
        </div>

        {/* Name */}
        <p className="font-heading text-sm font-bold leading-tight text-ink">
          {player.name}
        </p>

        {/* Status */}
        {isCheckedIn ? (
          <span className="font-body text-[10px] font-bold uppercase tracking-[2px] text-crimson">
            ✓ Presente
          </span>
        ) : isLoggedIn ? (
          <button
            onClick={() => handleCheckIn(player.id)}
            disabled={isLoading}
            className="rounded-md bg-ink px-3 py-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-canvas transition-all duration-150 hover:-translate-y-0.5 hover:bg-crimson disabled:opacity-50"
          >
            {isLoading ? "..." : "Check-in"}
          </button>
        ) : (
          <span className="font-body text-xs text-muted">–</span>
        )}
      </div>
    );
  })}
</div>
```

**Also add** the `getInitials` helper function at the top of the file (before the component), since it's used in the card avatar:
```tsx
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
```

**Step 1: Apply all changes to check-in-form.tsx**

**Step 2: Run build**

```bash
cd C:/Users/User/poker-league && npm run build
```
Expected: BUILD SUCCESSFUL.

**Step 3: Commit**

```bash
git add components/check-in-form.tsx
git commit -m "feat: replace check-in table with card grid"
```

---

### Task 5: Player Grid + Login page — rounded + shadows (`components/player-grid.tsx` + `app/login/page.tsx`)

**Files:**
- Modify: `components/player-grid.tsx`
- Modify: `app/login/page.tsx`

#### 5a — `components/player-grid.tsx`

**Player card** (line 120): `border border-border-subtle bg-surface p-5 transition-colors hover:border-crimson/30`
→ `rounded-xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-crimson/30 hover:shadow-[var(--shadow-md)]`

**Add input** (line 93): `border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none`
→ `rounded-md border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-ink placeholder:text-muted focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/20`

**Add button** (line 98): `bg-ink px-6 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson disabled:opacity-50`
→ `rounded-md bg-ink px-6 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-crimson hover:shadow-[var(--shadow-md)] disabled:opacity-50`

#### 5b — `app/login/page.tsx`

**Form card** (line 52): `border-2 border-ink bg-surface px-8 py-10`
→ `rounded-2xl bg-surface px-8 py-10 shadow-[var(--shadow-lg)]`

**Email input** (line 65): `mt-2 block w-full border border-border-strong bg-canvas px-3 py-2.5 font-body text-sm text-ink focus:border-ink focus:bg-surface focus:outline-none`
→ `mt-2 block w-full rounded-md border border-border-strong bg-canvas px-3 py-2.5 font-body text-sm text-ink focus:border-crimson focus:bg-surface focus:outline-none focus:ring-2 focus:ring-crimson/20`

**Password input** (line 80): same as email input, apply same change.

**Submit button** (line 93): `w-full bg-crimson py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828] disabled:opacity-50`
→ `w-full rounded-md bg-crimson py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)] disabled:opacity-50`

**Step 1: Apply changes to player-grid.tsx**

**Step 2: Apply changes to login/page.tsx**

**Step 3: Run build**

```bash
cd C:/Users/User/poker-league && npm run build
```
Expected: BUILD SUCCESSFUL.

**Step 4: Commit**

```bash
git add components/player-grid.tsx app/login/page.tsx
git commit -m "feat: rounded cards, shadow, and improved inputs on player grid and login"
```

---

### Task 6: Home page (Sobre cards) + Seasons list container (`app/page.tsx` + `app/seasons/page.tsx`)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/seasons/page.tsx`

#### 6a — `app/page.tsx` — "Sobre" cards (lines 198-211)

**Card wrapper** (line 199): `border border-border-strong bg-surface p-7 transition-colors hover:border-crimson/30`
→ `rounded-lg border border-border-strong bg-surface p-7 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-crimson/30 hover:shadow-[var(--shadow-md)]`

**Hero primary button** (line 100):
`inline-block bg-crimson px-8 py-3.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828]`
→ `inline-block rounded-md bg-crimson px-8 py-3.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)]`

**Hero secondary button** (line 108):
`inline-block border-2 border-ink px-8 py-3.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-ink transition-all hover:bg-ink hover:text-canvas`
→ `inline-block rounded-md border-2 border-ink px-8 py-3.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-ink transition-all duration-150 hover:-translate-y-0.5 hover:bg-ink hover:text-canvas`

**CTA banner button** (line 327):
`mt-10 inline-block bg-crimson px-12 py-4 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828]`
→ `mt-10 inline-block rounded-md bg-crimson px-12 py-4 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)]`

#### 6b — `app/seasons/page.tsx` — Season list container

**List container** (line 36): `border border-border-strong bg-surface`
→ `overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-sm)]`

**Empty state container** (line 32): `border border-border-strong bg-surface px-8 py-12 text-center`
→ `rounded-xl border border-border-subtle bg-surface px-8 py-12 text-center`

**Step 1: Apply changes to app/page.tsx**

**Step 2: Apply changes to app/seasons/page.tsx**

**Step 3: Run build**

```bash
cd C:/Users/User/poker-league && npm run build
```
Expected: BUILD SUCCESSFUL.

**Step 4: Commit**

```bash
git add app/page.tsx app/seasons/page.tsx
git commit -m "feat: rounded cards, shadows and button animations on home and seasons pages"
```

---

### Final: Push

```bash
git push
```
