/**
 * Track B — Canonical stock formation layouts.
 *
 * Used by HeroTactical / TeamLineup as the fallback layout when the
 * Python validator (utils/formation_validator.py) rejects an LLM-produced
 * coordinate set. The Python side mirrors this table at
 * STOCK_FORMATION_PYTHON.
 *
 * Coordinate system: x ∈ [0,100], y ∈ [0,100], pitch oriented vertically
 * with attacker at high y. Roles: GK | CB | FB | CDM | CM | AM | W | ST.
 */

export type FormationNode = {
  role: "GK" | "CB" | "FB" | "CDM" | "CM" | "AM" | "W" | "ST";
  x: number;
  y: number;
  name?: string;
};

export const STOCK_FORMATION: Record<string, FormationNode[]> = {
  "4-2-3-1": [
    { role: "GK",  x: 50, y: 5  },
    { role: "CB",  x: 36, y: 22 },
    { role: "CB",  x: 64, y: 22 },
    { role: "FB",  x: 12, y: 30 },
    { role: "FB",  x: 88, y: 30 },
    { role: "CDM", x: 40, y: 42 },
    { role: "CDM", x: 60, y: 42 },
    { role: "AM",  x: 50, y: 62 },
    { role: "W",   x: 14, y: 70 },
    { role: "W",   x: 86, y: 70 },
    { role: "ST",  x: 50, y: 84 },
  ],
  "4-2-2-2": [
    { role: "GK",  x: 50, y: 5  },
    { role: "CB",  x: 36, y: 22 },
    { role: "CB",  x: 64, y: 22 },
    { role: "FB",  x: 12, y: 30 },
    { role: "FB",  x: 88, y: 30 },
    { role: "CDM", x: 40, y: 42 },
    { role: "CDM", x: 60, y: 42 },
    { role: "AM",  x: 38, y: 64 },
    { role: "AM",  x: 62, y: 64 },
    { role: "ST",  x: 42, y: 84 },
    { role: "ST",  x: 58, y: 84 },
  ],
  "4-3-3": [
    { role: "GK",  x: 50, y: 5  },
    { role: "CB",  x: 36, y: 22 },
    { role: "CB",  x: 64, y: 22 },
    { role: "FB",  x: 12, y: 30 },
    { role: "FB",  x: 88, y: 30 },
    { role: "CM",  x: 30, y: 48 },
    { role: "CM",  x: 50, y: 48 },
    { role: "CM",  x: 70, y: 48 },
    { role: "W",   x: 14, y: 72 },
    { role: "W",   x: 86, y: 72 },
    { role: "ST",  x: 50, y: 84 },
  ],
  "3-5-2": [
    { role: "GK", x: 50, y: 5  },
    { role: "CB", x: 32, y: 22 },
    { role: "CB", x: 50, y: 22 },
    { role: "CB", x: 68, y: 22 },
    { role: "FB", x: 10, y: 38 },
    { role: "FB", x: 90, y: 38 },
    { role: "CM", x: 32, y: 50 },
    { role: "CM", x: 50, y: 50 },
    { role: "CM", x: 68, y: 50 },
    { role: "ST", x: 42, y: 84 },
    { role: "ST", x: 58, y: 84 },
  ],
  "4-4-2": [
    { role: "GK", x: 50, y: 5  },
    { role: "CB", x: 36, y: 22 },
    { role: "CB", x: 64, y: 22 },
    { role: "FB", x: 12, y: 30 },
    { role: "FB", x: 88, y: 30 },
    { role: "CM", x: 36, y: 50 },
    { role: "CM", x: 64, y: 50 },
    { role: "W",  x: 14, y: 68 },
    { role: "W",  x: 86, y: 68 },
    { role: "ST", x: 42, y: 84 },
    { role: "ST", x: 58, y: 84 },
  ],
  "4-1-4-1": [
    { role: "GK",  x: 50, y: 5  },
    { role: "CB",  x: 36, y: 22 },
    { role: "CB",  x: 64, y: 22 },
    { role: "FB",  x: 12, y: 30 },
    { role: "FB",  x: 88, y: 30 },
    { role: "CDM", x: 50, y: 40 },
    { role: "CM",  x: 32, y: 56 },
    { role: "CM",  x: 68, y: 56 },
    { role: "W",   x: 14, y: 70 },
    { role: "W",   x: 86, y: 70 },
    { role: "ST",  x: 50, y: 84 },
  ],
};
