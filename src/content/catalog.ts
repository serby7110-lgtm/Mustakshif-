/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified Encyclopedia Catalog bridging public-domain cross-cultural stories
 * (story | myth | cosmology | folklore) with the classical Mustakshif archive
 * and the Creatures / Beings directory.
 */

import type { AppLang } from '../i18n';
import type { MythCategory, MythEntry, MythSource } from '../data/types';
import { myths as legacyMyths } from '../data/types';
import type { ContentItem, ContentType, LocalizedText } from './catalogTypes';
import { PUBLIC_DOMAIN_STORIES } from './publicDomainStories';
import { CREATURES_CATALOG } from './creaturesCatalog';
import { getLocalizedEntry } from './index';

export const CONTENT_TYPE_META: Record<ContentType, { label: LocalizedText; accent: string; tint: string }> = {
  story: {
    label: {
      ar: 'قصة',
      en: 'Story',
      id: 'Kisah',
      th: 'นิทาน',
    },
    accent: '#0E5C4D',
    tint: '#F2FBF7',
  },
  myth: {
    label: {
      ar: 'أسطورة',
      en: 'Myth',
      id: 'Mitologi',
      th: 'ตำนาน',
    },
    accent: '#4A90D9',
    tint: '#E8F1FB',
  },
  cosmology: {
    label: {
      ar: 'كوسمولوجيا',
      en: 'Cosmology',
      id: 'Kosmologi',
      th: 'จักรวาลวิทยา',
    },
    accent: '#8E7BE8',
    tint: '#ECE7F8',
  },
  folklore: {
    label: {
      ar: 'فلكلور',
      en: 'Folklore',
      id: 'Cerita Rakyat',
      th: 'คติชน',
    },
    accent: '#17877B',
    tint: '#E6F8F0',
  },
};

export const CULTURE_META: Record<string, LocalizedText> = {
  arabian: {
    ar: 'التراث العربي',
    en: 'Arabian Heritage',
    id: 'Warisan Arab',
    th: 'มรดกอาหรับ',
  },
  mesopotamian: {
    ar: 'بلاد الرافدين',
    en: 'Mesopotamian',
    id: 'Mesopotamia',
    th: 'เมโสโปเตเมีย',
  },
  babylonian_arabian: {
    ar: 'البابلي والعربي',
    en: 'Babylonian & Arabian',
    id: 'Babilonia & Arab',
    th: 'บาบิโลนและอาหรับ',
  },
  indonesian: {
    ar: 'الأرخبيل الإندونيسي',
    en: 'Indonesian',
    id: 'Nusantara / Indonesia',
    th: 'อินโดนีเซีย',
  },
  thai: {
    ar: 'التراث التايلاندي',
    en: 'Thai Heritage',
    id: 'Warisan Thailand',
    th: 'วัฒนธรรมไทย',
  },
};

export interface TagMeta {
  key: string;
  label: LocalizedText;
  description: LocalizedText;
}

export const STORY_TAG_META: Record<string, TagMeta> = {
  sacred_forest: {
    key: 'sacred_forest',
    label: {
      ar: 'الغابة والحصاد',
      en: 'Sacred Nature',
      id: 'Alam & Kesuburan',
      th: 'ป่าศักดิ์สิทธิ์และผืนดิน',
    },
    description: {
      ar: 'مقارنة رمزية العلاقة بين الإنسان والغابة والمياه الحية عبر الحضارات.',
      en: 'How different cultures symbolize human stewardship of sacred groves, mountain springs, and living soil.',
      id: 'Perbandingan simbolik hubungan manusia dengan hutan suci, mata air pegunungan, dan kesuburan bumi.',
      th: 'เปรียบเทียบสัญลักษณ์ความสัมพันธ์ระหว่างมนุษย์กับผืนป่า สายน้ำ และผืนดินข้ามวัฒนธรรม',
    },
  },
  hero_quest: {
    key: 'hero_quest',
    label: {
      ar: 'رحلة البطل',
      en: 'Hero’s Quest',
      id: 'Perjalanan Pahlawan',
      th: 'การเดินทางของวีรบุรุษ',
    },
    description: {
      ar: 'تأمل مقارنة كيف تتشابه اختبارات الشجاعة والصبر عبر الملاحم الشرقية والآسيوية.',
      en: 'Cross-cultural trials of resolve, friendship, and endurance across ancient epics and folk quests.',
      id: 'Perbandingan ujian keberanian, kesetiaan, dan keteguhan hati dalam berbagai tradisi cerita.',
      th: 'เปรียบเทียบบททดสอบความกล้าหาญ มิตรภาพ และความเพียรในวรรณกรรมต่างวัฒนธรรม',
    },
  },
  sky_water: {
    key: 'sky_water',
    label: {
      ar: 'السماء والماء',
      en: 'Sky & Water',
      id: 'Langit & Air',
      th: 'ฟากฟ้าและสายน้ำ',
    },
    description: {
      ar: 'حين يلتقي الماء بمرآة السماء: من بحار الأفلاك إلى بئر القرية وغابات الضباب.',
      en: 'Celestial reflections and sacred waters bridging ancient stargazing, wells, and river legends.',
      id: 'Pertemuan simbol langit dan air dalam kosmologi bintang, sumur desa, dan kisah rakyat.',
      th: 'จุดบรรจบของฟากฟ้าและผืนน้ำ ตั้งแต่ดวงดาว บ่อน้ำ ไปจนถึงสายน้ำแห่งตำนาน',
    },
  },
  cosmos_order: {
    key: 'cosmos_order',
    label: {
      ar: 'نظام الكون',
      en: 'Cosmic Order',
      id: 'Tatanan Kosmos',
      th: 'ระเบียบแห่งจักรวาล',
    },
    description: {
      ar: 'كيف تصورت الثقافات توازن الأفلاك والطبيعة بين الحساب الفلكي وتوزيع الخيرات.',
      en: 'Visions of balance across celestial spheres and earthly seasons in classical lore.',
      id: 'Pandangan lintas budaya tentang keteraturan langit dan keseimbangan alam.',
      th: 'มุมมองข้ามวัฒนธรรมว่าด้วยความสมดุลของวงโคจรดวงดาวและฤดูกาลบนโลก',
    },
  },
  sacred_light: {
    key: 'sacred_light',
    label: {
      ar: 'النور والبروج',
      en: 'Celestial Light',
      id: 'Cahaya Langit',
      th: 'แสงแห่งดวงดาว',
    },
    description: {
      ar: 'رمز النور السماوي والكواكب الهادية في الأساطير والمدونات القديمة.',
      en: 'Motifs of guiding starlight and translucent heavens in Mediterranean, Arabian, and Asian lore.',
      id: 'Motif cahaya bintang dan lapisan cakrawala dalam khazanah kuno.',
      th: 'สัญลักษณ์ของแสงดาวและฟากฟ้าใสในตำนานตะวันออกและเอเชีย',
    },
  },
  wisdom_wit: {
    key: 'wisdom_wit',
    label: {
      ar: 'الحكمة والطرافة',
      en: 'Wisdom & Wit',
      id: 'Hikmah & Kecerdikan',
      th: 'ปัญญาและคติสอนใจ',
    },
    description: {
      ar: 'حكايات تجمع الفطنة الشعبية بالعبرة الأخلاقية في المجالس الشرقية.',
      en: 'Where folk humor, quiet ethics, and sharp reflection illuminate daily wisdom across cultures.',
      id: 'Kisah lintas budaya yang memadukan kecerdikan rakyat dengan pelajaran moral.',
      th: 'นิทานที่ผสานไหวพริบชาวบ้านเข้ากับคติสอนใจข้ามวัฒนธรรม',
    },
  },
  night_journey: {
    key: 'night_journey',
    label: {
      ar: 'مسرى الليل',
      en: 'Night Journey',
      id: 'Pengembaraan Malam',
      th: 'การเดินทางยามราตรี',
    },
    description: {
      ar: 'حكايات الترحال تحت القمر والعبور الليلي في الأساطير والفلكلور.',
      en: 'Moonlit voyages and nocturnal thresholds across Middle Eastern and Southeast Asian storytelling.',
      id: 'Kisah perjalanan di bawah cahaya bulan melintasi gurun, sumur, dan danau.',
      th: 'เรื่องราวการเดินทางใต้แสงจันทร์และการก้าวข้ามพรมแดนยามค่ำคืน',
    },
  },
  'رعب': {
    key: 'رعب',
    label: { ar: 'رعب', en: 'Horror', id: 'Horor', th: 'สยองขวัญ' },
    description: {
      ar: 'كائنات الفلوات والقصص الليلية المخيفة في الذاكرة التراثية.',
      en: 'Desert apparitions and nocturnal terrors across classical folklore.',
      id: 'Sosok misterius malam dan gurun dalam cerita rakyat klasik.',
      th: 'เรื่องราวลี้ลับและสิ่งมีชีวิตยามค่ำคืนในคติชนโบราณ',
    },
  },
  'تاريخ': {
    key: 'تاريخ',
    label: { ar: 'تاريخ', en: 'History', id: 'Sejarah', th: 'ประวัติศาสตร์' },
    description: {
      ar: 'مواضع موثقة في النقوش والمدونات التاريخية والرحلات.',
      en: 'Accounts anchored in inscriptions, chronicles, and classical travelogues.',
      id: 'Catatan yang berakar pada prasasti, kronik, dan kisah perjalanan klasik.',
      th: 'เรื่องราวที่เชื่อมโยงกับจารึก พงศาวดาร และบันทึกการเดินทาง',
    },
  },
  'خرافي': {
    key: 'خرافي',
    label: { ar: 'خرافي', en: 'Mythical', id: 'Mitologis', th: 'ตำนานอัศจรรย์' },
    description: {
      ar: 'عجائب الجزر النائية والكائنات والأفلاك في المخيال الجمعي.',
      en: 'Marvels of distant islands, mythic creatures, and cosmic geography.',
      id: 'Keajaiban pulau jauh, makhluk mitologi, dan geografi imajinatif.',
      th: 'สิ่งมหัศจรรย์แห่งเกาะลึกลับ สัตว์ในตำนาน และภูมิศาสตร์เชิงจินตนาการ',
    },
  },
};

const LEGACY_LAT_LNG: Record<string, { lat: number; lng: number }> = {
  'al-ghul': { lat: 24.71, lng: 46.67 },
  'al-anqa': { lat: 29.5, lng: 51.0 },
  'iram-dhat-al-imad': { lat: 18.25, lng: 53.65 },
  'al-lat': { lat: 21.27, lng: 40.42 },
  'al-jinn': { lat: 26.15, lng: 43.95 },
  'al-uzza': { lat: 21.62, lng: 40.15 },
  manat: { lat: 22.38, lng: 39.15 },
  hubal: { lat: 21.42, lng: 39.83 },
  wadd: { lat: 29.81, lng: 39.87 },
  suwa: { lat: 21.95, lng: 40.05 },
  yaghuth: { lat: 15.65, lng: 44.32 },
  yauq: { lat: 15.88, lng: 43.92 },
  nasr: { lat: 14.35, lng: 44.65 },
  'al-si-la': { lat: 23.1, lng: 45.2 },
  'al-rukh': { lat: 12.6, lng: 53.9 },
  'al-shiqq': { lat: 28.4, lng: 41.5 },
  'al-marid': { lat: 20.5, lng: 38.2 },
  'al-ifrit': { lat: 16.5, lng: 45.8 },
  qutrub: { lat: 30.3, lng: 35.4 },
  'al-hama': { lat: 25.4, lng: 45.5 },
  'al-sada': { lat: 25.9, lng: 44.1 },
  'dabbat-al-ard': { lat: 21.35, lng: 39.88 },
  'faluk-snake': { lat: 14.0, lng: 51.5 },
  'waq-waq': { lat: 6.2, lng: 73.1 },
  'jabal-qaf': { lat: 36.1, lng: 52.1 },
  'well-of-barhout': { lat: 17.3, lng: 52.45 },
  'wadi-abqar': { lat: 25.1, lng: 42.9 },
  'marib-dam': { lat: 15.4, lng: 45.3 },
  'city-of-brass': { lat: 31.1, lng: -4.0 },
  'ghumdan-palace': { lat: 15.35, lng: 44.21 },
  'jabal-al-dukhan': { lat: 24.47, lng: 39.61 },
  'rub-al-khali': { lat: 19.5, lng: 50.0 },
  'zarqa-al-yamama': { lat: 24.15, lng: 47.3 },
  'dhul-qarnayn': { lat: 38.5, lng: 48.2 },
  sinbad: { lat: 30.51, lng: 47.82 },
  'ibn-battuta': { lat: 35.76, lng: -5.83 },
  juha: { lat: 33.31, lng: 44.36 },
  harut_marut: { lat: 32.54, lng: 44.42 },
  malik: { lat: 32.0, lng: 45.1 },
  kahana: { lat: 31.9, lng: 44.3 },
  qaf: { lat: 36.2, lng: 52.0 },
  marid: { lat: 20.5, lng: 38.2 },
  wad_abqar: { lat: 25.1, lng: 42.9 },
};

function inferRegionCoords(myth: MythEntry): { lat: number; lng: number } {
  const direct = LEGACY_LAT_LNG[myth.id];
  if (direct) return direct;
  const r = `${myth.region ?? ''} ${myth.name ?? ''}`;
  if (r.includes('اليمن') || r.includes('مأرب') || r.includes('حضرموت')) return { lat: 15.5, lng: 44.5 };
  if (r.includes('مكة') || r.includes('الحجاز') || r.includes('الطائف')) return { lat: 21.45, lng: 39.85 };
  if (r.includes('بابل') || r.includes('العراق') || r.includes('بغداد')) return { lat: 33.1, lng: 44.4 };
  if (r.includes('الشام') || r.includes('تدمر') || r.includes('البتراء')) return { lat: 33.5, lng: 36.3 };
  if (r.includes('المغرب') || r.includes('طنجة') || r.includes('الأندلس')) return { lat: 34.0, lng: -5.0 };
  if (r.includes('مصر')) return { lat: 30.04, lng: 31.23 };
  // Slight deterministic spread within Arabian Peninsula
  let hash = 0;
  for (let i = 0; i < myth.id.length; i += 1) {
    hash = (hash * 31 + myth.id.charCodeAt(i)) % 1000;
  }
  return {
    lat: 18 + (hash % 12),
    lng: 39 + ((hash >> 3) % 14),
  };
}

function inferContentType(myth: MythEntry): ContentType {
  const id = myth.id;
  if (
    id.includes('qaf') ||
    id.includes('faluk') ||
    id.includes('zuhal') ||
    id.includes('suhayl') ||
    id.includes('thurayya') ||
    id.includes('anwaa') ||
    id.includes('bahr_zulumat')
  ) {
    return 'cosmology';
  }
  if (myth.category === 'gods' || myth.category === 'creatures' || myth.category === 'seers') {
    return 'myth';
  }
  if (myth.category === 'rituals' || myth.category === 'places') {
    return 'folklore';
  }
  if (myth.category === 'heroes' || myth.category === 'sa3aleek' || myth.category === 'kings' || myth.category === 'personalities') {
    return 'story';
  }
  return 'myth';
}

function buildLocalizedLegacyItem(rawMyth: MythEntry): ContentItem {
  const arLoc = getLocalizedEntry(rawMyth, 'ar');
  const enLoc = getLocalizedEntry(rawMyth, 'en');
  const idLoc = getLocalizedEntry(rawMyth, 'id');
  const thLoc = getLocalizedEntry(rawMyth, 'th');

  const coords = inferRegionCoords(rawMyth);
  const firstSource: MythSource | undefined = rawMyth.sources?.[0];
  const enSource: MythSource | undefined = enLoc.sources?.[0];
  const idSource: MythSource | undefined = idLoc.sources?.[0];
  const thSource: MythSource | undefined = thLoc.sources?.[0];

  const linkedCreatures = CREATURES_CATALOG.filter(
    (c) => c.storyIds.includes(rawMyth.id) || c.legacyMythId === rawMyth.id
  ).map((c) => c.id);

  const normalizedImage =
    typeof rawMyth.heroImage === 'string' && rawMyth.heroImage.trim()
      ? rawMyth.heroImage.startsWith('/')
        ? rawMyth.heroImage
        : `/${rawMyth.heroImage}`
      : '/images/anqa.jpg';

  return {
    id: rawMyth.id,
    type: inferContentType(rawMyth),
    culture: 'arabian',
    region: {
      lat: coords.lat,
      lng: coords.lng,
      label: {
        ar: arLoc.region || 'شبه الجزيرة العربية',
        en: enLoc.region || arLoc.region || 'Arabian Peninsula',
        id: idLoc.region || enLoc.region || arLoc.region || 'Jazirah Arab',
        th: thLoc.region || enLoc.region || arLoc.region || 'คาบสมุทรอาหรับ',
      },
    },
    tags: Array.isArray(rawMyth.tags) && rawMyth.tags.length > 0 ? [...rawMyth.tags] : ['خرافي'],
    title: {
      ar: arLoc.name,
      en: enLoc.name || arLoc.name,
      id: idLoc.name || enLoc.name || arLoc.name,
      th: thLoc.name || enLoc.name || arLoc.name,
    },
    summary: {
      ar: arLoc.summary || '',
      en: enLoc.summary || arLoc.summary || '',
      id: idLoc.summary || enLoc.summary || arLoc.summary || '',
      th: thLoc.summary || enLoc.summary || arLoc.summary || '',
    },
    text: {
      ar: Array.isArray(arLoc.body) ? arLoc.body : [],
      en: Array.isArray(enLoc.body) && enLoc.body.length > 0 ? enLoc.body : arLoc.body || [],
      id: Array.isArray(idLoc.body) && idLoc.body.length > 0 ? idLoc.body : arLoc.body || [],
      th: Array.isArray(thLoc.body) && thLoc.body.length > 0 ? thLoc.body : arLoc.body || [],
    },
    source: {
      title: {
        ar: firstSource?.title || 'مصادر التراث العربي الكلاسيكي',
        en: enSource?.title || firstSource?.title || 'Classical Arabic Heritage Sources',
        id: idSource?.title || enSource?.title || firstSource?.title || 'Sumber Warisan Arab Klasik',
        th: thSource?.title || enSource?.title || firstSource?.title || 'เอกสารมรดกอาหรับคลาสสิก',
      },
      author: {
        ar: firstSource?.author || 'مؤرخو الأدب والتراث',
        en: enSource?.author || firstSource?.author || 'Classical Chroniclers',
        id: idSource?.author || enSource?.author || firstSource?.author || 'Sejarawan Klasik',
        th: thSource?.author || enSource?.author || firstSource?.author || 'นักประวัติศาสตร์คลาสสิก',
      },
      year: firstSource?.year,
    },
    image: normalizedImage,
    creatureIds: linkedCreatures.length > 0 ? linkedCreatures : undefined,
    legacyCategory: rawMyth.category,
    isPublicDomain: false,
  };
}

const publicIds = new Set(PUBLIC_DOMAIN_STORIES.map((s) => s.id));

export const CONTENT_CATALOG: ContentItem[] = [
  ...PUBLIC_DOMAIN_STORIES,
  ...legacyMyths.filter((m) => m && !publicIds.has(m.id)).map(buildLocalizedLegacyItem),
];

const catalogByIdMap = new Map<string, ContentItem>(CONTENT_CATALOG.map((item) => [item.id, item]));

export function getContentItemById(id: string): ContentItem | undefined {
  return catalogByIdMap.get(id);
}

export function getTypeLabel(type: ContentType, lang: AppLang): string {
  return CONTENT_TYPE_META[type]?.label[lang] ?? CONTENT_TYPE_META[type]?.label.ar ?? type;
}

export function getCultureLabel(culture: string, lang: AppLang): string {
  return CULTURE_META[culture]?.[lang] ?? CULTURE_META[culture]?.ar ?? culture;
}

export function getTagLabel(tagKey: string, lang: AppLang): string {
  return STORY_TAG_META[tagKey]?.label[lang] ?? STORY_TAG_META[tagKey]?.label.ar ?? tagKey;
}

export function getTagMeta(tagKey: string): TagMeta {
  return (
    STORY_TAG_META[tagKey] ?? {
      key: tagKey,
      label: { ar: tagKey, en: tagKey, id: tagKey, th: tagKey },
      description: {
        ar: `استكشف ومقارنة جميع القصص المرتبطة بوسم «${tagKey}» عبر الثقافات.`,
        en: `Compare all stories sharing the “${tagKey}” theme across cultures.`,
        id: `Bandingkan seluruh kisah bertagar “${tagKey}” lintas budaya.`,
        th: `เปรียบเทียบเรื่องราวที่ใช้แท็ก “${tagKey}” ข้ามวัฒนธรรม`,
      },
    }
  );
}

const CONTENT_TYPE_TO_MYTH_CAT: Record<ContentType, MythCategory> = {
  story: 'personalities',
  myth: 'creatures',
  cosmology: 'places',
  folklore: 'rituals',
};

export function toMythEntry(item: ContentItem, lang: AppLang = 'ar'): MythEntry {
  const typeLabel = getTypeLabel(item.type, lang);
  const safeCategory = item.legacyCategory ?? CONTENT_TYPE_TO_MYTH_CAT[item.type] ?? 'personalities';
  return {
    id: item.id,
    name: item.title[lang] || item.title.ar,
    latinName: item.title.en || item.id,
    category: safeCategory,
    typeLabel,
    entryType: typeLabel,
    heroImage: item.image,
    summary: item.summary[lang] || item.summary.ar,
    body: item.text[lang]?.length ? item.text[lang] : item.text.ar,
    sources: [
      {
        title: item.source.title[lang] || item.source.title.ar,
        author: item.source.author[lang] || item.source.author.ar,
        year: item.source.year || '',
      },
    ],
    timeline: [
      {
        era: lang === 'ar' ? 'الأصل التراثي' : lang === 'en' ? 'Classical Roots' : lang === 'id' ? 'Akar Klasik' : 'รากเหง้าคลาสสิก',
        note: `${getCultureLabel(item.culture, lang)} • ${item.region.label[lang] || item.region.label.ar}`,
      },
    ],
    region: item.region.label[lang] || item.region.label.ar,
    related: item.creatureIds
      ? item.creatureIds
          .map((cid) => CREATURES_CATALOG.find((c) => c.id === cid)?.legacyMythId)
          .filter((mid): mid is string => Boolean(mid && mid !== item.id))
      : [],
    tags: item.tags as MythEntry['tags'],
  };
}
