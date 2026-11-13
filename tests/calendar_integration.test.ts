import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WORKSPACE_SCOPES } from '../src/lib/firebase';
import {
  createCalendarEvent,
  listUpcomingReadingEvents,
  deleteCalendarEvent,
} from '../src/services/calendar';

test('Firebase: WORKSPACE_SCOPES contains required Google Calendar scopes', () => {
  assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/calendar'));
  assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/calendar.events'));
  assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/calendar.readonly'));
});

test('Calendar Service: service methods are defined with proper signatures', () => {
  assert.equal(typeof createCalendarEvent, 'function');
  assert.equal(typeof listUpcomingReadingEvents, 'function');
  assert.equal(typeof deleteCalendarEvent, 'function');
});

test('ArticleScreen: Implements Google Calendar scheduling with mandatory confirmation dialog', () => {
  const articlePath = path.resolve('src/screens/ArticleScreen.tsx');
  const code = fs.readFileSync(articlePath, 'utf8');

  assert.ok(code.includes('scheduleReadingSession'), 'Must use scheduleReadingSession');
  assert.ok(code.includes('جدولة قراءة في تقويم Google'), 'Must offer Calendar scheduling button');
  assert.ok(code.includes('تأكيد إضافة الحدث إلى تقويم Google'), 'Must present explicit confirmation dialog');
  assert.ok(code.includes('handleScheduleSession'), 'Must define handleScheduleSession handler');
});

test('ProfileScreen: Implements Google Calendar management and deletion confirmation dialog', () => {
  const profilePath = path.resolve('src/screens/ProfileScreen.tsx');
  const code = fs.readFileSync(profilePath, 'utf8');

  assert.ok(code.includes('جلسات القراءة في تقويم Google'), 'Must include Calendar row 7.7 in Profile');
  assert.ok(code.includes('getUpcomingReadingEvents'), 'Must call getUpcomingReadingEvents');
  assert.ok(code.includes('cancelReadingSession'), 'Must call cancelReadingSession');
  assert.ok(code.includes('تأكيد حذف الحدث من تقويم Google'), 'Must present explicit delete confirmation dialog');
  assert.ok(code.includes('handleLoadCalendarEvents'), 'Must define handleLoadCalendarEvents handler');
  assert.ok(code.includes('handleDeleteCalendarEvent'), 'Must define handleDeleteCalendarEvent handler');
});
