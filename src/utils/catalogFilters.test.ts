/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  filterContentItems,
  getStoryOfTheDay,
  pickRandomStory,
  getCrossCulturalTagComparison,
  filterCreatures,
  getStoriesForCreature,
  getCreaturesForStory,
  getUniqueCultures,
  getUniqueTags,
} from './catalogFilters.ts';
import { PUBLIC_DOMAIN_STORIES } from '../content/publicDomainStories.ts';
import { CREATURES_CATALOG } from '../content/creaturesCatalog.ts';
import { CONTENT_CATALOG, getContentItemById, toMythEntry } from '../content/catalog.ts';

describe('Public-domain stories & unified catalog validation', () => {
  test('all 5 public-domain stories have complete 4-language data, coords, tags, source, and images', () => {
    assert.equal(PUBLIC_DOMAIN_STORIES.length, 5);
    const langs = ['ar', 'en', 'id', 'th'] as const;
    const types = new Set(PUBLIC_DOMAIN_STORIES.map((s) => s.type));

    assert.ok(types.has('story'));
    assert.ok(types.has('myth'));
    assert.ok(types.has('cosmology'));
    assert.ok(types.has('folklore'));

    for (const story of PUBLIC_DOMAIN_STORIES) {
      assert.ok(story.id.startsWith('pd-'));
      assert.ok(Number.isFinite(story.region.lat) && Math.abs(story.region.lat) <= 90);
      assert.ok(Number.isFinite(story.region.lng) && Math.abs(story.region.lng) <= 180);
      assert.ok(story.tags.length >= 2);
      assert.ok(story.image.startsWith('/images/'));

      for (const lang of langs) {
        assert.ok(story.title[lang].trim().length > 0, `${story.id} missing title.${lang}`);
        assert.ok(story.summary[lang].trim().length > 0, `${story.id} missing summary.${lang}`);
        assert.ok(story.text[lang].length >= 2, `${story.id} missing text.${lang}`);
        assert.ok(story.region.label[lang].trim().length > 0, `${story.id} missing region.${lang}`);
        assert.ok(story.source.title[lang].trim().length > 0, `${story.id} missing source.title.${lang}`);
        assert.ok(story.source.author[lang].trim().length > 0, `${story.id} missing source.author.${lang}`);
      }
    }
  });

  test('filterContentItems filters by type, culture, tag, favorites, and search across languages', () => {
    const folkloreOnly = filterContentItems(PUBLIC_DOMAIN_STORIES, { type: 'folklore' });
    assert.equal(folkloreOnly.length, 1);
    assert.equal(folkloreOnly[0]?.id, 'pd-dewi-sri');

    const thaiOnly = filterContentItems(PUBLIC_DOMAIN_STORIES, { culture: 'thai' });
    assert.equal(thaiOnly.length, 1);
    assert.equal(thaiOnly[0]?.id, 'pd-manohara-kinnari');

    const wisdomStories = filterContentItems(PUBLIC_DOMAIN_STORIES, { tag: 'wisdom_wit' });
    assert.equal(wisdomStories.length, 3);

    const favFiltered = filterContentItems(PUBLIC_DOMAIN_STORIES, {
      onlyFavorites: true,
      favoriteIds: ['pd-cedar-forest', 'pd-juha-moon-well'],
    });
    assert.equal(favFiltered.length, 2);

    // Search with Arabic normalization and Thai/Indonesian text
    const searchAr = filterContentItems(PUBLIC_DOMAIN_STORIES, { query: 'القمر' });
    assert.ok(searchAr.some((s) => s.id === 'pd-juha-moon-well'));

    const searchId = filterContentItems(PUBLIC_DOMAIN_STORIES, { query: 'Nusantara' });
    assert.ok(searchId.some((s) => s.id === 'pd-dewi-sri'));

    const searchTh = filterContentItems(PUBLIC_DOMAIN_STORIES, { query: 'กินรี' });
    assert.ok(searchTh.some((s) => s.id === 'pd-manohara-kinnari'));
  });

  test('getStoryOfTheDay is deterministic by calendar date and pickRandomStory respects excludeId', () => {
    const day1 = getStoryOfTheDay(CONTENT_CATALOG, new Date('2026-05-10T10:00:00Z'));
    const day1Later = getStoryOfTheDay(CONTENT_CATALOG, new Date('2026-05-10T23:59:00Z'));
    const day2 = getStoryOfTheDay(CONTENT_CATALOG, new Date('2026-05-11T10:00:00Z'));

    assert.ok(day1);
    assert.equal(day1?.id, day1Later?.id);
    assert.notEqual(day1?.id, day2?.id);

    const picked = pickRandomStory(PUBLIC_DOMAIN_STORIES, 'pd-cedar-forest', () => 0);
    assert.ok(picked);
    assert.notEqual(picked?.id, 'pd-cedar-forest');
  });

  test('getCrossCulturalTagComparison groups stories across distinct cultures', () => {
    const comparison = getCrossCulturalTagComparison(CONTENT_CATALOG, 'wisdom_wit');
    assert.equal(comparison.tag, 'wisdom_wit');
    assert.equal(comparison.totalStories, 3);
    assert.equal(comparison.cultureCount, 3);
    const cultures = comparison.groups.map((g) => g.culture);
    assert.ok(cultures.includes('arabian'));
    assert.ok(cultures.includes('indonesian'));
    assert.ok(cultures.includes('thai'));
  });

  test('Creatures directory filters by kind and resolves bidirectional links with stories', () => {
    const deities = filterCreatures(CREATURES_CATALOG, 'deity');
    const spirits = filterCreatures(CREATURES_CATALOG, 'spirit');
    const monsters = filterCreatures(CREATURES_CATALOG, 'creature');

    assert.ok(deities.length >= 3);
    assert.ok(spirits.length >= 3);
    assert.ok(monsters.length >= 3);

    const kinnari = CREATURES_CATALOG.find((c) => c.id === 'being-kinnari');
    assert.ok(kinnari);
    const kinnariStories = getStoriesForCreature(kinnari!, CONTENT_CATALOG);
    assert.ok(kinnariStories.some((s) => s.id === 'pd-manohara-kinnari'));
    assert.ok(kinnariStories.some((s) => s.id === 'pd-celestial-spheres'));

    const cedarBeings = getCreaturesForStory(
      'pd-cedar-forest',
      CREATURES_CATALOG,
      getContentItemById('pd-cedar-forest')?.creatureIds
    );
    assert.ok(cedarBeings.some((b) => b.id === 'being-humbaba'));
    assert.ok(cedarBeings.some((b) => b.id === 'being-anqa'));
  });

  test('toMythEntry adapts ContentItem cleanly across languages and metadata helpers', () => {
    const dewi = getContentItemById('pd-dewi-sri');
    assert.ok(dewi);
    const mythEn = toMythEntry(dewi!, 'en');
    assert.equal(mythEn.name, 'Dewi Sri and the Blessing of the Living Harvest');
    assert.equal(mythEn.typeLabel, 'Folklore');
    assert.ok(getUniqueCultures(PUBLIC_DOMAIN_STORIES).length >= 5);
    assert.ok(getUniqueTags(PUBLIC_DOMAIN_STORIES).length >= 5);
  });
});
