# Design — Modernização Visual dos Componentes

**Data:** 2026-02-28
**Status:** Aprovado

## Objetivo

Modernizar a estética do app introduzindo border-radius moderado (8-12px), sombras com profundidade, glassmorphism na nav, micro-animações e melhor feedback visual nos elementos interativos.

## Decisões

| Decisão | Escolha |
|---------|---------|
| Border-radius | Moderado: `sm` 4px · `md` 8px · `lg` 12px |
| Estética nav | Glassmorphism: `bg-canvas/80 backdrop-blur-md` + shadow no scroll |
| Botões | `rounded-md` + lift no hover (`-translate-y-0.5 shadow-md`) |
| Inputs | `rounded-md` + focus ring crimson com `ring-2 ring-crimson/20` |
| Cards | `rounded-lg shadow-sm` + lift no hover (`-translate-y-1 shadow-md`) |
| Dialog | `rounded-xl shadow-xl` + `backdrop-blur-sm` no overlay |
| Check-in | Grid de cards (como PlayerGrid) em vez de tabela |

## Tokens a adicionar (`globals.css`)

```css
/* Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

/* Shadows — light */
:root {
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);
}

/* Shadows — dark */
.dark {
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.30);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.40);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.50);
}
```

Registrar no `@theme inline`:
```css
--radius-sm: var(--radius-sm);
--radius-md: var(--radius-md);
--radius-lg: var(--radius-lg);
--shadow-sm: var(--shadow-sm);
--shadow-md: var(--shadow-md);
--shadow-lg: var(--shadow-lg);
```

## Componentes

### Nav Bar (`components/nav-bar.tsx`)
- `bg-canvas` → `bg-canvas/80 backdrop-blur-md`
- `border-b-2 border-ink` → `border-b border-border-strong`
- Scroll listener: `scrollY > 10` adiciona `shadow-md`; volta a `shadow-none` no topo
- Link ativo: adicionar underline bar crimson animada via `after:` pseudo-class ou classe condicional

### Botão Primário (bg-crimson — aparece em todas as páginas)
```
rounded-md shadow-sm transition-all duration-150
hover:-translate-y-0.5 hover:shadow-md
```

### Botão Secundário (border-2 border-ink)
```
rounded-md transition-all duration-150
hover:-translate-y-0.5
```

### Inputs
```
rounded-md
focus:border-crimson focus:ring-2 focus:ring-crimson/20 focus:outline-none
```

### Cards de conteúdo (home, player-grid, season cards)
```
rounded-lg shadow-sm transition-all duration-200
hover:-translate-y-1 hover:shadow-md
```

### Confirm Dialog (`components/confirm-dialog.tsx`)
- Overlay: `bg-black/40 backdrop-blur-sm`
- Container: `rounded-xl shadow-xl` (remover `border-2 border-ink`)
- Entrada: `animate-in fade-in zoom-in-95 duration-150`

### Check-in Form (`components/check-in-form.tsx`)
- Substituir tabela por grid de cards (2col mobile / 3col desktop)
- Cada card: avatar iniciais (`bg-panel rounded-full`) + nome + botão ou badge
- Consistente com `PlayerGrid`

## Arquivos

| Ação | Arquivo |
|------|---------|
| Modificar | `app/globals.css` |
| Modificar | `components/nav-bar.tsx` |
| Modificar | `components/confirm-dialog.tsx` |
| Modificar | `components/check-in-form.tsx` |
| Modificar | `components/player-grid.tsx` |
| Modificar | `app/login/page.tsx` |
| Modificar | `app/page.tsx` (cards "Sobre") |
| Modificar | `app/seasons/page.tsx` |
| Modificar | `app/players/page.tsx` (header buttons) |
