# Design System Rules — Poker League (TTPF)

> Documento gerado para integração com Figma via MCP (Model Context Protocol).
> Use estas regras ao converter designs do Figma em código para este projeto.

---

## Stack

| Item | Versão |
|------|--------|
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | ✓ |
| Tailwind CSS | 4.1.18 |
| next-themes | ✓ (light/dark) |
| Supabase | ✓ |
| Netlify | Deploy |

---

## 1. Design Tokens (CSS Variables)

Definidos em `app/globals.css`. **Sempre use tokens semânticos — nunca valores hardcoded.**

### Light Mode (`:root`)
```css
:root {
  --canvas: #f5f0eb;                        /* Fundo principal (off-white/cream) */
  --ink: #1a1a1a;                           /* Texto primário */
  --secondary: #666666;                     /* Texto secundário */
  --muted: #999999;                         /* Texto terciário */
  --surface: #ffffff;                        /* Cards, painéis */
  --panel: #1a1a1a;                         /* Painel dark (sempre escuro) */
  --border-strong: rgba(26, 26, 26, 0.15);  /* Bordas principais */
  --border-subtle: rgba(26, 26, 26, 0.08);  /* Bordas sutis */
  --tint-crimson: rgba(229, 57, 53, 0.05);  /* Fundo tintado (linhas destacadas) */
  --tint-crimson-row: rgba(229, 57, 53, 0.04); /* Tint mais suave para rows */
}
```

### Dark Mode (`.dark`)
```css
.dark {
  --canvas: #121212;
  --ink: #f0ebe4;
  --secondary: #8a8a8a;
  --muted: #4a4a4a;
  --surface: #1e1e1e;
  --panel: #252525;
  --border-strong: rgba(240, 235, 228, 0.12);
  --border-subtle: rgba(240, 235, 228, 0.07);
  --tint-crimson: rgba(229, 57, 53, 0.10);
  --tint-crimson-row: rgba(229, 57, 53, 0.08);
}
```

**Cor de marca estática (sem variante dark):**
```css
--color-crimson: #e53935;   /* Vermelho crimson — sempre igual em ambos os temas */
```

---

## 2. Tailwind CSS 4 — Tokens Disponíveis

Configurados via `@theme inline` em `globals.css` (Tailwind 4 sem `tailwind.config.ts`):

```css
@theme inline {
  --color-canvas: var(--canvas);
  --color-ink: var(--ink);
  --color-secondary: var(--secondary);
  --color-muted: var(--muted);
  --color-crimson: #e53935;
  --color-surface: var(--surface);
  --color-panel: var(--panel);
  --color-border-strong: var(--border-strong);
  --color-border-subtle: var(--border-subtle);
  --color-tint-crimson: var(--tint-crimson);
  --color-tint-crimson-row: var(--tint-crimson-row);
}
```

**Classes Tailwind disponíveis:**

| Token | Classe Tailwind |
|-------|----------------|
| Fundo principal | `bg-canvas` |
| Card/surface | `bg-surface` |
| Painel dark | `bg-panel` |
| Tint vermelho | `bg-tint-crimson` |
| Tint row | `bg-tint-crimson-row` |
| Texto primário | `text-ink` |
| Texto secundário | `text-secondary` |
| Texto terciário | `text-muted` |
| Cor de marca | `text-crimson`, `bg-crimson` |
| Borda principal | `border-border-strong` |
| Borda sutil | `border-border-subtle` |

---

## 3. Tipografia

**Fontes carregadas em `app/layout.tsx` via `next/font/google`:**

| Fonte | Variável CSS | Classe Tailwind | Uso | Pesos |
|-------|-------------|-----------------|-----|-------|
| **Libre Baskerville** | `--font-heading` | `font-heading` | Headings, título, serif | 400, 700 |
| **DM Sans** | `--font-body` | `font-body` | Body, UI, rótulos | 300, 400, 500, 700 |

**Padrões tipográficos:**

```tsx
// Logo
<span className="font-heading text-2xl font-bold tracking-[3px] uppercase">
  TTP<span className="text-crimson">F</span>
</span>

// Heading de página
<h1 className="font-heading text-3xl font-bold text-ink">

// Rótulo maiúsculo (uppercase label)
<span className="font-body text-[10px] font-bold uppercase tracking-[2px] text-secondary">

// Link de nav
<a className="font-body font-bold uppercase tracking-[2px] text-sm">

// Texto corrido
<p className="font-body text-secondary text-sm">

// Valor de destaque (pontos, ranking)
<span className="font-body font-bold text-crimson">
```

---

## 4. Layout

**Single-column responsivo com max-width:**

```tsx
// Container padrão de página
<main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

// Seção com borda inferior
<section className="border-b border-border-subtle pb-8 mb-8">

// Grid de cards (stats)
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
```

**Estrutura do layout root (`app/layout.tsx`):**
```
┌─────────────────────────────────────────────┐
│  NAVBAR (sticky top, bg-canvas, borda base) │
├─────────────────────────────────────────────┤
│  MAIN (max-w-5xl, mx-auto, px-4/6, py-10)  │
│                                             │
│  [Conteúdo da página]                       │
└─────────────────────────────────────────────┘
```

---

## 5. Componentes — Padrões

### Abordagem de Estilo

O projeto usa **100% Tailwind CSS 4** com tokens semânticos — sem styled-jsx, sem CSS Modules:

```tsx
// ✅ Correto
<div className="bg-surface border border-border-strong rounded-lg p-5">

// ❌ Errado — hardcoded
<div style={{ background: "#ffffff", border: "1px solid rgba(26,26,26,0.15)" }}>

// ❌ Errado — styled-jsx
<style jsx>{`.card { ... }`}</style>
```

### NavBar

```tsx
<nav className="sticky top-0 z-50 bg-canvas border-b border-border-subtle">
  {/* Desktop: flex row com gap-6 entre links */}
  {/* Mobile: chevron dropdown (▼/▲), links em coluna com dividers */}
  {/* Active link: text-crimson */}
  {/* Theme toggle: canto direito */}
</nav>
```

### Tabelas (Leaderboard, SeasonGrid)

```tsx
<table className="w-full text-sm font-body">
  <thead>
    <tr className="border-b border-border-strong text-[10px] uppercase tracking-[2px] text-secondary">
      <th>...</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-border-subtle hover:bg-canvas/60 transition-colors">
      {/* Rank top 3: badge bg-crimson text-white */}
      {/* Pontos: text-crimson font-bold */}
    </tr>
  </tbody>
</table>
```

### Cards de Estatística

```tsx
<div className="bg-surface border border-border-subtle rounded-lg p-5">
  <p className="text-[10px] font-bold uppercase tracking-[2px] text-secondary font-body mb-1">
    Rótulo
  </p>
  <p className="text-3xl font-bold text-ink font-heading">
    Valor
  </p>
</div>
```

### Botões

```tsx
// Primário (crimson filled)
<button className="bg-crimson text-white font-body font-bold px-5 py-2.5 rounded text-sm uppercase tracking-[1px] hover:opacity-90 transition-opacity">

// Secundário (outline)
<button className="border border-border-strong text-ink font-body text-sm px-4 py-2 rounded hover:bg-canvas/60 transition-colors">

// Link/ghost
<button className="text-secondary hover:text-ink font-body text-sm transition-colors">
```

### Formulários

```tsx
<div className="space-y-4">
  <label className="block text-[10px] font-bold uppercase tracking-[2px] text-secondary font-body">
    Rótulo
  </label>
  <input className="w-full bg-surface border border-border-strong rounded px-4 py-2.5 text-ink font-body text-sm focus:border-crimson focus:outline-none transition-colors" />
</div>
```

### Modal / Dialog

```tsx
{/* Overlay */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  {/* Modal */}
  <div className="bg-surface border border-border-strong rounded-lg p-6 w-full max-w-md mx-4">
    ...
  </div>
</div>
```

---

## 6. Ícones

**O projeto usa SVG inline** — sem biblioteca de ícones externa (sem lucide-react, heroicons, etc.):

```tsx
// Exemplo: ícone de sol (theme toggle)
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/>
  {/* ... */}
</svg>
```

**Ao importar do Figma:** exportar ícones como SVG e criar componentes React inline — não instalar bibliotecas de ícones.

---

## 7. Interações & Animações

- **Transição padrão:** `transition-colors` (cores) ou `transition-opacity`
- **Hover em rows de tabela:** `hover:bg-canvas/60`
- **Hover em links de nav:** cor muda para `text-ink` (de `text-secondary`)
- **Active nav link:** `text-crimson`
- **Hover em botões primários:** `hover:opacity-90`
- **Hover em botões outline:** `hover:bg-canvas/60`
- **Focus em inputs:** `focus:border-crimson focus:outline-none`

---

## 8. Dark Mode

O projeto usa `next-themes` com `ThemeProvider`. **Nunca hardcode estilos que não funcionem em ambos os temas.**

```tsx
// ✅ Funciona em ambos os temas
<div className="bg-canvas text-ink border border-border-strong">

// ❌ Quebra no dark mode
<div className="bg-white text-gray-900 border-gray-200">
```

**Painel (`bg-panel`) é sempre escuro** em ambos os temas — use apenas para seções que devem sempre ter fundo escuro (e.g., footer, sidebar especial).

**Theme toggle:** componente `<ThemeToggle />` em `components/theme-toggle.tsx`.

---

## 9. Estrutura de Pastas

```
poker-league/
├── app/
│   ├── layout.tsx               ← Root layout (fontes, NavBar, Providers)
│   ├── providers.tsx            ← ThemeProvider wrapper
│   ├── globals.css              ← CSS variables + @theme inline
│   ├── page.tsx                 ← Landing/home
│   ├── check-in/
│   ├── estatisticas/
│   ├── hall-da-fama/
│   ├── login/
│   ├── perfil/
│   ├── players/
│   └── seasons/
├── components/
│   ├── nav-bar.tsx              ← Navbar responsiva + dark mode toggle
│   ├── theme-toggle.tsx         ← Botão sol/lua
│   ├── leaderboard.tsx          ← Tabela de ranking
│   ├── season-grid.tsx          ← Grade de pontuações por semana
│   ├── attendance-score-form.tsx
│   ├── check-in-form.tsx
│   ├── confirm-dialog.tsx       ← Modal de confirmação acessível
│   └── player-list.tsx
└── lib/
    ├── supabase/
    │   ├── client.ts
    │   ├── server.ts
    │   ├── use-auth.ts
    │   └── types.ts
    └── queries/
        ├── seasons.ts
        ├── players.ts
        ├── checkin.ts
        ├── roster.ts
        └── scores.ts
```

---

## 10. Regras para Integração com Figma

Ao usar `get_design_context` do MCP Figma:

1. **Cores:** Mapear hexadecimais do Figma → tokens Tailwind (`bg-canvas`, `text-ink`, `text-crimson`, etc.)
2. **Fontes:** Libre Baskerville → `font-heading`; DM Sans → `font-body`. Não usar outras fontes.
3. **Bordas:** Sempre `border-border-strong` (principal) ou `border-border-subtle` (suave). Nunca rgba hardcoded.
4. **Dark mode:** Usar apenas tokens semânticos — nunca `bg-white`, `text-gray-*`, `border-gray-*`.
5. **Tailwind puro:** Zero styled-jsx, zero CSS Modules, zero inline styles (exceto quando absolutamente necessário).
6. **Ícones:** SVG inline — não instalar bibliotecas. Extrair do Figma como SVG.
7. **Spacing:** Classes Tailwind padrão (`p-4`, `gap-3`, `px-5 py-2.5`, etc.)
8. **Tipografia uppercase:** Usar padrão `text-[10px] font-bold uppercase tracking-[2px]` para rótulos de seção.
9. **Crimson:** Usar apenas para destaques de marca, rankings, links ativos — nunca para texto corrido.
10. **Max-width:** Todo conteúdo dentro de `max-w-5xl mx-auto px-4 sm:px-6`.
