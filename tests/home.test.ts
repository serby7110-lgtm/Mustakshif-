import test from 'node:test';
import assert from 'node:assert/strict';
import { MYTH_ENTRIES, getEntryById } from '../src/data/seed';

test('HomeScreen dependencies: Anqa entry exists for the hero banner', () => {
  const anqa = getEntryById('al-anqa');
  assert.ok(anqa, 'Al-Anqa must exist');
  assert.equal(anqa.name, 'العنقاء');
  assert.ok(anqa.heroImage.length > 0);
  assert.ok(anqa.summary.length > 0);
});

test('HomeScreen dependencies: Most read list includes al-ghul, iram-dhat-al-imad, and al-jinn', () => {
  const ghul = getEntryById('al-ghul');
  const iram = getEntryById('iram-dhat-al-imad');
  const jinn = getEntryById('al-jinn');

  assert.ok(ghul, 'Al-Ghul must be present in most read');
  assert.ok(iram, 'Iram must be present in most read');
  assert.ok(jinn, 'Al-Jinn must be present in most read');

  assert.equal(ghul.tags[0], 'رعب');
  assert.equal(iram.tags[0], 'تاريخ');
  assert.equal(jinn.tags[0], 'رعب');
});

test('HomeScreen categories mapping matches the 2x2 grid requirements', () => {
  const categories = ['creatures', 'gods', 'rituals', 'places'];
  for (const cat of categories) {
    const entries = MYTH_ENTRIES.filter((e) => e.category === cat);
    assert.ok(entries.length > 0, `Category ${cat} must have entries`);
  }
});
