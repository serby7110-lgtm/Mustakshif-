/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Civilization Data Models & Types (حضارات وأقوام شبه الجزيرة العربية)
 */

import civilizationsData from './civilizations.json';

export interface CivilizationChapter {
  title: string;
  text: string;
}

export interface Civilization {
  id: string;
  name: string;
  latinName: string;
  era: string;
  startYear?: number;
  endYear?: number;
  region: string;
  cities: string[];
  economy: string;
  society: string;
  religion: string;
  prophet: string;
  quranRefs: string[];
  chapters: { title: string; text: string }[];
  archaeology: string[];
  historianNote?: string;
  traditionView?: string;
  archaeologyView?: string;
  legacy: string;
  relatedMyths: string[];
  tags: string[];
}

export const CIVILIZATIONS: Civilization[] = civilizationsData as unknown as Civilization[];

/**
 * Retrieve a civilization by its unique identifier
 */
export function getCivById(id: string): Civilization | undefined {
  if (!id) return undefined;
  return CIVILIZATIONS.find((c) => c.id === id);
}

/**
 * Get all available civilizations
 */
export function getAllCivilizations(): Civilization[] {
  return CIVILIZATIONS;
}

/**
 * Find civilization that lists a specific myth ID in relatedMyths
 */
export function getCivByRelatedMythId(mythId: string): Civilization | undefined {
  if (!mythId) return undefined;
  return CIVILIZATIONS.find((c) => (c.relatedMyths || []).includes(mythId));
}

/**
 * Format a civilization into a plain-text narrative version:
 * name + era + region, then chapters as "## title\n text", then archaeology bullet lines.
 */
export function formatCivilizationNarrative(civ: Civilization): string {
  const parts: string[] = [];

  // name + era + region
  parts.push(`${civ.name} — ${civ.era} — ${civ.region}`);

  // chapters as "## title\n text"
  if (civ.chapters && civ.chapters.length > 0) {
    const chaptersText = civ.chapters
      .map((ch) => `## ${ch.title}\n${ch.text}`)
      .join('\n\n');
    parts.push(chaptersText);
  }

  // archaeology bullet lines
  if (civ.archaeology && civ.archaeology.length > 0) {
    const archText = civ.archaeology
      .map((item) => `• ${item}`)
      .join('\n');
    parts.push(archText);
  }

  return parts.join('\n\n');
}

