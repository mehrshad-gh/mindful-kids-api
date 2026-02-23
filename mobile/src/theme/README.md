# Mindful Kids Design System

## Color palette

Import from `theme/colors` or `theme`:

- **primary** `#4A90A4` — Teal, main actions
- **primaryDark** `#3A7585` — Hover/active
- **secondary** `#F5A623` — Accent (e.g. badges)
- **background** `#F8F9FA` — Screen background
- **surface** `#FFFFFF` — Cards, inputs
- **text** `#2C3E50` — Primary text
- **textSecondary** `#7F8C8D` — Supporting text
- **border** `#E0E6ED` — Borders, dividers
- **success** `#27AE60` — Success states
- **warning** `#F39C12` — Ratings, warnings
- **error** `#E74C3C` — Errors
- **childAccent** `#9B59B6` — Child-mode accent
- **parentAccent** `#3498DB` — Parent-mode accent

## Typography

Import `typography` from `theme/typography`. Use spread in StyleSheet:

- **h1** — 28px, bold (screen titles)
- **h2** — 22px, bold (section titles)
- **h3** — 18px, semibold (card titles)
- **body** — 16px, lineHeight 24 (paragraphs)
- **bodySmall** — 15px, lineHeight 22
- **subtitle** — 14px, secondary (descriptions)
- **caption** — 12px, secondary (meta, hints)
- **label** — 12px, semibold, uppercase (form labels, section labels)
- **accent** — 15px, primary color
- **error** — 14px, error color
- **success** — 14px, success color

## Spacing

From `theme/spacing`:

- **xs** 4, **sm** 8, **md** 16, **lg** 24, **xl** 32, **xxl** 48
- **borderRadius**: sm 6, md 12, lg 16, full 9999

## Layout tokens

From `theme` (index):

- **screenPadding** 16 — Horizontal padding for screens
- **cardPadding** 16 — Card inner padding
- **sectionGap** 24 — Between major sections
- **listItemGap** 12 — Between list/card items

## Button

From `components/ui/Button`:

- **variant**: `primary` | `secondary` | `ghost` | `outline`
- **size**: `medium` (default) | `small`

Uses theme colors, spacing, and typography.body for label.

## Card

From `components/ui/Card`:

- **variant**: `default` | `elevated` (slightly stronger shadow)
- Uses `layout.cardPadding`, `colors.surface`, `borderRadius.md`, `colors.border`.
