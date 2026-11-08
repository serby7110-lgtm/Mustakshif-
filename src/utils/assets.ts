/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Asset Utilities (مستكشف)
 * Maps civilizations and entities to high-fidelity visual assets.
 */

import civMadyanImg from '../assets/images/civ_madyan_1793905344133.jpg';
import civAadImg from '../assets/images/civ_aad_1793905356428.jpg';
import civThamudImg from '../assets/images/civ_thamud_1793905368317.jpg';
import civSabaImg from '../assets/images/civ_saba_1793906475567.jpg';
import civHimyarImg from '../assets/images/civ_himyar_1793906489123.jpg';
import civNabataeanImg from '../assets/images/civ_nabataean_1793907679046.jpg';
import civTasmJadisImg from '../assets/images/civ_tasm_jadis_1793907694122.jpg';
import civLakhmImg from '../assets/images/civ_lakhm_1793955331462.jpg';
import civGhassanImg from '../assets/images/civ_ghassan_1793955344225.jpg';
import civMeccaImg from '../assets/images/civ_mecca_1794066216722.jpg';

export const CIV_IMAGES: Record<string, string> = {
  'civ-madyan': civMadyanImg || '/images/civ-madyan.jpg',
  'civ-aad': civAadImg || '/images/civ-aad.jpg',
  'civ-thamud': civThamudImg || '/images/civ-thamud.jpg',
  'civ-saba': civSabaImg || '/images/civ-saba.jpg',
  'civ-himyar': civHimyarImg || '/images/civ-himyar.jpg',
  'civ-nabataean': civNabataeanImg || '/images/civ-nabataean.jpg',
  'civ-tasm-jadis': civTasmJadisImg || '/images/civ-tasm-jadis.jpg',
  'civ-lakhm': civLakhmImg || '/images/civ-lakhm.jpg',
  'civ-ghassan': civGhassanImg || '/images/civ-ghassan.jpg',
  'civ-mecca': civMeccaImg || '/images/civ-mecca.jpg',
};

/**
 * Returns the image URL for a given civilization ID, falling back to public image path.
 */
export function getCivImageUrl(id: string): string {
  if (!id) return '';
  return CIV_IMAGES[id] || `/images/${id}.jpg`;
}
