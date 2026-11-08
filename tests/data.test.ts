import test from 'node:test';
import assert from 'node:assert/strict';
import { MYTH_ENTRIES, getEntryById, getEntriesByCategory } from '../src/data/seed';

test('Seed database contains at least 50 entries', () => {
  assert.ok(MYTH_ENTRIES.length >= 50);
});

test('The 5 core entries are fully articulated with 3-4 body paragraphs', () => {
  const coreIds = ['al-ghul', 'al-anqa', 'iram-dhat-al-imad', 'al-lat', 'al-jinn'];

  for (const id of coreIds) {
    const entry = getEntryById(id);
    assert.ok(entry, `Entry with id ${id} must exist`);
    assert.ok(entry.body.length >= 3 && entry.body.length <= 4, `${id} should have 3-4 body paragraphs, got ${entry.body.length}`);
    assert.ok(entry.sources.length >= 2, `${id} should have multiple classical sources`);
    assert.ok(entry.timeline.length >= 2, `${id} should have timeline entries`);
    assert.ok(entry.region.length > 0, `${id} should have a geographic region`);
    assert.ok(entry.summary.length > 0, `${id} should have a 1-line Arabic summary`);
  }
});

test('All entries strictly adhere to the MythEntry schema', () => {
  const validCategories = new Set(['gods', 'creatures', 'places', 'heroes', 'rituals', 'personalities', 'sa3aleek', 'kings', 'seers']);
  const validTags = new Set(['رعب', 'تاريخ', 'خرافي']);
  const validEras = new Set(['جاهلية', 'صدر الإسلام', 'العصر العباسي']);

  const seenIds = new Set<string>();

  for (const entry of MYTH_ENTRIES) {
    assert.ok(!seenIds.has(entry.id), `Duplicate ID detected: ${entry.id}`);
    seenIds.add(entry.id);

    assert.ok(entry.name && entry.name.trim().length > 0, `Missing name for ${entry.id}`);
    assert.ok(validCategories.has(entry.category), `Invalid category ${entry.category} for ${entry.id}`);
    assert.ok(entry.typeLabel && entry.typeLabel.trim().length > 0, `Missing typeLabel for ${entry.id}`);
    assert.ok(entry.heroImage && (entry.heroImage.startsWith('http') || entry.heroImage.startsWith('/src/assets/')), `Missing or invalid heroImage for ${entry.id}`);
    assert.ok(entry.summary && entry.summary.trim().length > 0, `Missing summary for ${entry.id}`);
    assert.ok(Array.isArray(entry.body) && entry.body.length > 0, `Missing body for ${entry.id}`);
    assert.ok(Array.isArray(entry.sources) && entry.sources.length > 0, `Missing sources for ${entry.id}`);
    assert.ok(Array.isArray(entry.timeline) && entry.timeline.length > 0, `Missing timeline for ${entry.id}`);
    assert.ok(entry.region && entry.region.trim().length > 0, `Missing region for ${entry.id}`);
    assert.ok(Array.isArray(entry.related), `Missing related array for ${entry.id}`);
    assert.ok(Array.isArray(entry.tags) && entry.tags.length > 0, `Missing tags for ${entry.id}`);

    for (const tag of entry.tags) {
      assert.ok(validTags.has(tag), `Invalid tag ${tag} for entry ${entry.id}`);
    }

    for (const pt of entry.timeline) {
      assert.ok(validEras.has(pt.era), `Invalid era ${pt.era} for entry ${entry.id}`);
      assert.ok(pt.note && pt.note.length > 0, `Empty timeline note for entry ${entry.id}`);
    }

    for (const src of entry.sources) {
      assert.ok(src.title && src.author && src.year, `Incomplete source in ${entry.id}`);
    }
  }
});
