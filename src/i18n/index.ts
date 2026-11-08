import { ar } from './ar';
import { id } from './id';
import { th } from './th';

export const translations = {
  ar,
  id,
  th
};

export type TranslationKey = keyof typeof ar;
