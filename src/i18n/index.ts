import { ar } from './ar';
import { en } from './en';
import { id } from './id';
import { th } from './th';

export const translations = {
  ar,
  en,
  id,
  th
};

export type TranslationKey = keyof typeof ar;
