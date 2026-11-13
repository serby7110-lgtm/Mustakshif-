import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createBase64Email } from '../src/services/gmail';
import { WORKSPACE_SCOPES } from '../src/lib/firebase';

test('Gmail Service: createBase64Email generates valid base64url encoded message', () => {
  const encoded = createBase64Email({
    to: 'serby7110@gmail.com',
    subject: 'مستكشف: تجربة التواصل',
    bodyText: 'نص تجريبي للتواصل',
    bodyHtml: '<p>نص تجريبي للتواصل</p>',
  });

  assert.ok(encoded, 'Encoded string must be non-empty');
  assert.ok(!encoded.includes('+'), 'Must not contain standard base64 +');
  assert.ok(!encoded.includes('/'), 'Must not contain standard base64 /');
  assert.ok(!encoded.includes('='), 'Must not contain base64 padding =');

  // Decode and check content
  const decoded = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  assert.ok(decoded.includes('To: serby7110@gmail.com'), 'Must contain recipient header');
  assert.ok(decoded.includes('Subject:'), 'Must contain Subject header');
  assert.ok(decoded.includes('multipart/alternative'), 'Must be multipart/alternative');
});

test('Firebase: WORKSPACE_SCOPES contains required Gmail and Drive scopes', () => {
  assert.ok(WORKSPACE_SCOPES.includes('https://mail.google.com/'));
  assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/gmail.send'));
  assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/gmail.compose'));
  assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/gmail.readonly'));
  assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/drive.file'));
});

test('ContactScreen: Implements direct Gmail submission with mandatory confirmation dialog', () => {
  const contactPath = path.resolve('src/screens/ContactScreen.tsx');
  const code = fs.readFileSync(contactPath, 'utf8');

  assert.ok(code.includes('sendEmailWithGmail'), 'Must use sendEmailWithGmail');
  assert.ok(code.includes('إرسال مباشر عبر حسابي في Gmail'), 'Must offer Gmail direct send button');
  assert.ok(code.includes('تأكيد الإرسال عبر Gmail'), 'Must present explicit confirmation dialog');
  assert.ok(code.includes('serby7110@gmail.com'), 'Must route to editorial email');
});

test('ProfileScreen: Implements Gmail Bookmarks Summary Report with confirmation dialog', () => {
  const profilePath = path.resolve('src/screens/ProfileScreen.tsx');
  const code = fs.readFileSync(profilePath, 'utf8');

  assert.ok(code.includes('إرسال ملخص المحفوظات عبر Gmail'), 'Must include Gmail summary row');
  assert.ok(code.includes('تأكيد إرسال الملخص عبر Gmail'), 'Must present explicit confirmation dialog');
  assert.ok(code.includes('handleSendGmailSummary'), 'Must define handleSendGmailSummary');
});
