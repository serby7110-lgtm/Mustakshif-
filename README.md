# مستكشف — موسوعة الأساطير والحضارات العربية

## عن التطبيق
موسوعة تفاعلية تضم 62 أسطورة و10 حضارات عربية، برواية التراث والآثار معاً. مصمم للباحثين وكتّاب القصص وصنّاع الألعاب.

## الميزات
- 📚 62 بطاقة أسطورية + 10 حضارات
- 🗺️ خريطة تفاعلية 2D
- ⏳ خط زمن تفاعلي
- 📖 حكايات عميقة بفصول
- 🎮 عدّة المبدع (خطافات حكاية، أدوار لعبية، قرارات لاعب)
- 🌓 وضع ليلي
- 🔊 قراءة صوتية
- 📤 تصدير المفضلة والقوالب
- 📱 PWA يعمل دون إنترنت

## التثبيت
```bash
npm install
npm run dev
```

## أوامر التشغيل والاختبار
```bash
# تشغيل خادم التطوير المحلي
npm run dev

# بناء النسخة الإنتاجية
npm run build

# تشغيل حزمة اختبارات الوحدة (72 اختباراً)
npx tsx --test tests/**/*.test.ts

# التحقق من سلامة الأنماط والـ TypeScript
npm run lint
```

## المنهجية العلمية والتوثيق
يتبنى تطبيق «مستكشف» منهجية توثيق صارمة تفرّق بين المروي والموثّق عبر أربع شارات أساسية:
1. **نص حرفي**: نصوص أصيلة منقولة بأمانة من القرآن أو الحديث أو أمهات كتب التراث المطبوعة (الجاحظ، المسعودي، الكلبي، ياقوت الحموي).
2. **بأسلوب المصدر**: تلخيص بروح المصادر القديمة وأسلوبها دون تحريف.
3. **الرواية الشعبية**: ما تناقلته الذاكرة الشفاهية والحكواتيون والجدّات كتراث ثقافي أصيل.
4. **التحليل التاريخي والآثاري**: ما تقوله الاكتشافات الأثرية والنقوش والتاريخ المقارن، مع عرض الروايتين جنباً إلى جنب في نمط السرد المزدوج (Dual-Narrative Mode).

---

# Mustakshif — Encyclopedia of Arabian Myths and Civilizations

## About
An interactive encyclopedia featuring 62 myths and 10 ancient Arabian civilizations, narrated through both classical heritage and archaeological history. Designed for researchers, storytellers, and game developers.

## Features
- 📚 62 Myth Entries + 10 Civilizations
- 🗺️ Interactive 2D Vector Map (clean flat SVG with frustum culling and search)
- ⏳ Interactive Chronological Timeline (with cinematic auto-tour and era filters)
- 📖 Deep Multi-Chapter Stories with Dual Narrative (Heritage Tradition & Archaeology)
- 🎮 Creator's Kit (Story Hooks, Game Roles, Dramatic Motifs, Player Dilemmas & Decisions)
- 🌓 Deep Teal / Mint Dark Mode with System Preference Sync
- 🔊 High-Fidelity Audio Narration with Voice Controls (Arabic TTS)
- 📤 Export Bookmarks and Story Templates (JSON export)
- 📱 Progressive Web App (PWA) with Complete Offline Support

## Installation
```bash
npm install
npm run dev
```

## Build and Testing
```bash
# Run development server
npm run dev

# Build production bundle
npm run build

# Run automated unit test suite (72 tests)
npx tsx --test tests/**/*.test.ts

# Run TypeScript linter
npm run lint
```

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS (Native RTL typography with Cairo, Aref Ruqaa, Amiri)
- **Icons**: Lucide React
- **PWA**: Service Worker (`sw.js`) with cache-first static assets & network-first data fallback
- **Testing**: Native Node.js test runner (`node:test`)

## License
Apache-2.0
