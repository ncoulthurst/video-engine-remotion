/**
 * finance/kit.tsx — re-export shim over the promoted shared kit (F3-core,
 * PRODUCTION_GAP_ANALYSIS.md §5).
 *
 * The full design system that used to live here was promoted verbatim to
 * `src/lib/kit.tsx` so EVERY template family (football root templates, finance,
 * future domains) composes from one kit. This shim exists so the 34 existing
 * finance templates keep compiling unchanged:
 *
 *   import { Ground, EASE, fadeUp, … } from "./kit";   // still works
 *
 * New/updated templates should import from the kit directly:
 *
 *   import { Ground, EASE, fadeUp, … } from "../lib/kit";
 *
 * The only definition kept here is `FinanceTexture` — a thin wrapper over the
 * generalised <DomainTexture domain="finance" /> (football passes
 * domain="football" for the faint pitch markings; see lib/kit.tsx).
 */
import React from "react";
import { DomainTexture, type Theme } from "../lib/kit";

export * from "../lib/kit";

/**
 * FinanceTexture — the finance-flavoured thematic background texture.
 * Paper → faint warm ledger grid. Ink → faint dot/ticker grid.
 * Kept as a named export for existing finance templates; equivalent to
 * <DomainTexture domain="finance" />.
 */
export const FinanceTexture: React.FC<{ theme?: Theme }> = ({ theme }) => (
  <DomainTexture theme={theme} domain="finance" />
);
