import test from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../src/data/storage';
import { FORMSPREE_ID, MessageType } from '../src/screens/ContactScreen';
import fs from 'node:fs';
import path from 'node:path';

test('Storage sent messages counter operations', () => {
  // Test initial get
  const initialCount = storage.getSentMessagesCount();
  assert.equal(typeof initialCount, 'number');

  // Test set and get
  storage.setSentMessagesCount(0);
  assert.equal(storage.getSentMessagesCount(), 0);

  // Test increment
  const updated1 = storage.incrementSentMessagesCount();
  assert.equal(updated1, 1);
  assert.equal(storage.getSentMessagesCount(), 1);

  const updated2 = storage.incrementSentMessagesCount();
  assert.equal(updated2, 2);
  assert.equal(storage.getSentMessagesCount(), 2);

  // Reset back to 0
  storage.setSentMessagesCount(0);
  assert.equal(storage.getSentMessagesCount(), 0);
});

test('ContactScreen Formspree configuration and constants', () => {
  assert.equal(FORMSPREE_ID, 'meaawdjn', 'FORMSPREE_ID must match user configured ID');
});

test('ContactScreen source code adheres strictly to STEPS 1-6 specification', () => {
  const contactFilePath = path.resolve(process.cwd(), 'src/screens/ContactScreen.tsx');
  const contactSrc = fs.readFileSync(contactFilePath, 'utf-8');

  // STEP 2: Screen title, subtitle, fields, button, privacy note
  assert.ok(contactSrc.includes('تواصل معنا'), 'Screen must contain title تواصل معنا');
  assert.ok(
    contactSrc.includes('شكواك، اقتراحك، أو اكتشافك لخطأ — صوتك يصلنا'),
    'Screen must contain exact subtitle'
  );
  assert.ok(contactSrc.includes('placeholder="الاسم"'), 'Must have Name input with placeholder الاسم');
  assert.ok(
    contactSrc.includes('placeholder="بريدك الإلكتروني"'),
    'Must have Email input with placeholder بريدك الإلكتروني'
  );
  assert.ok(
    contactSrc.includes('placeholder="عنوان الرسالة"'),
    'Must have Subject input with placeholder عنوان الرسالة'
  );
  assert.ok(
    contactSrc.includes('placeholder="اكتب رسالتك هنا..."'),
    'Must have Message textarea with placeholder اكتب رسالتك هنا...'
  );

  // Message types
  const types: MessageType[] = ['شكوى', 'اقتراح', 'خطأ في المحتوى', 'سؤال عام'];
  for (const t of types) {
    assert.ok(contactSrc.includes(t), `Type dropdown must include ${t}`);
  }

  // Button style & text
  assert.ok(contactSrc.includes('#4A90D9'), 'Submit button must use cool blue #4A90D9');
  assert.ok(contactSrc.includes('إرسال'), 'Submit button text must be إرسال');
  assert.ok(contactSrc.includes('جاري الإرسال...'), 'Loading text must be جاري الإرسال...');
  assert.ok(
    contactSrc.includes('رسالتك تصل مباشرة لمطور التطبيق عبر Formspree'),
    'Must contain privacy note'
  );

  // STEP 3: Formspree POST wiring & headers
  assert.ok(
    contactSrc.includes('https://formspree.io/f/'),
    'Must POST to Formspree endpoint'
  );
  assert.ok(
    contactSrc.includes('_subject: `مستكشف: ${type} - ${subject.trim()}`'),
    'Payload must format _subject as specified'
  );
  assert.ok(
    contactSrc.includes("'Content-Type': 'application/json'"),
    'Must send Content-Type header'
  );
  assert.ok(
    contactSrc.includes("'Accept': 'application/json'"),
    'Must send Accept header'
  );
  assert.ok(
    contactSrc.includes('✓ وصلت رسالتك، شكراً لك'),
    'Success toast must match exact string'
  );
  assert.ok(
    contactSrc.includes('فشل الإرسال، حاول لاحقاً'),
    'Error toast must match exact string'
  );

  // STEP 4: Validation
  assert.ok(contactSrc.includes('emailRegex'), 'Must have email regex validation');
  assert.ok(contactSrc.includes('disabled={!isValid || isSubmitting}'), 'Button must be disabled when form is invalid');

  // STEP 5: Alternative email & mailto link
  assert.ok(
    contactSrc.includes('البريد البديل'),
    'Must have البريد البديل section'
  );
  assert.ok(
    contactSrc.includes('serby7110@gmail.com'),
    'Must include developer email serby7110@gmail.com'
  );
  assert.ok(
    contactSrc.includes('mailto:serby7110@gmail.com?subject='),
    'Must have mailto link with subject'
  );
});

test('ProfileScreen integrates ContactScreen and displays sent messages counter', () => {
  const profileFilePath = path.resolve(process.cwd(), 'src/screens/ProfileScreen.tsx');
  const profileSrc = fs.readFileSync(profileFilePath, 'utf-8');

  assert.ok(
    profileSrc.includes("import { ContactScreen } from './ContactScreen'"),
    'ProfileScreen must import ContactScreen'
  );
  assert.ok(
    profileSrc.includes('isContactScreenOpen'),
    'ProfileScreen must have isContactScreenOpen state'
  );
  assert.ok(
    profileSrc.includes('عدد الرسائل المرسلة من هذا الجهاز'),
    'ProfileScreen must display badge/counter with exact text'
  );
  assert.ok(
    profileSrc.includes('setIsContactScreenOpen(true)'),
    'Profile row must open ContactScreen on click'
  );
});
