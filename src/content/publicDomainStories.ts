/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Five original public-domain literary retellings (ar / en / id / th)
 * crafted to exercise all content types (story, myth, cosmology, folklore),
 * cross-cultural tag comparisons, Leaflet map coordinates, Web Speech TTS,
 * and bidirectional creature links.
 */

import type { ContentItem } from './catalogTypes';

export const PUBLIC_DOMAIN_STORIES: ContentItem[] = [
  {
    id: 'pd-cedar-forest',
    type: 'myth',
    culture: 'mesopotamian',
    region: {
      lat: 34.2439,
      lng: 36.0486,
      label: {
        ar: 'جبال الأرز، بلاد الشام والرافدين',
        en: 'Cedar Mountains, Levant & Mesopotamia',
        id: 'Pegunungan Aras, Syam & Mesopotamia',
        th: 'เทือกเขาซีดาร์ ลิแวนต์และเมโสโปเตเมีย',
      },
    },
    tags: ['sacred_forest', 'hero_quest', 'sky_water'],
    title: {
      ar: 'جلجامش وإنكيدو في غابة الأرز المقدسة',
      en: 'Gilgamesh and Enkidu in the Sacred Cedar Forest',
      id: 'Gilgamesh dan Enkidu di Hutan Aras Suci',
      th: 'กิลกาเมชและเอนคิดูในป่าซีดาร์ศักดิ์สิทธิ์',
    },
    summary: {
      ar: 'رحلة بطلين قديمين عبر سفوح الجبال المغطاة بالضباب لمواجهة خمبابا حارس الأرز واستنطاق صدى الغابة.',
      en: 'Two ancient companions ascend mist-veiled limestone ridges to face Humbaba, guardian of the sacred cedars.',
      id: 'Dua sahabat kuno mendaki lereng berkabut untuk menghadapi Humbaba, penjaga pohon aras yang suci.',
      th: 'สองสหายโบราณไต่สันเขาหินปูนท่ามกลางม่านหมอกเพื่อเผชิญหน้าฮุมบาบา ผู้พิทักษ์ป่าสนซีดาร์ศักดิ์สิทธิ์',
    },
    text: {
      ar: [
        'في الزمن الذي كانت فيه شواهد الحجر تحفظ أنساب الأنهار، انطلق جلجامش ملك أوروك ورفيقه إنكيدو نحو أعالي جبال الأرز حيث تنحدر الغيوم لتستريح بين الجذوع المكسوة بالطحلب.',
        'لم تكن الغابة صامتة؛ فكل نسمة ريح كانت تحمل زئير خمبابا، الحارس الذي أوكلت إليه السماء صون الأشجار العالية من الفؤوس العابثة. وحين تعثّر إنكيدو عند العتبة الصخرية، تذكّر أن قوة الصداقة أثبت من دروع النحاس.',
        'ومع سطوع الفجر الأزرق البارد فوق القمم، أدرك الرفيقان أن المجد لا يُنتزع بهدم الغابة وحدها، بل بترك أثرٍ يُتلى على مسامع الأجيال بأن الطبيعة تمنح سرّها لمن يوقّر توازنها.',
      ],
      en: [
        'In an age when carved stone steles preserved the memory of great rivers, Gilgamesh of Uruk and his companion Enkidu journeyed toward the high Cedar Forest, where silver clouds gathered among moss-covered trunks.',
        'The grove was never silent; every mountain gust carried the distant cadence of Humbaba, the watchful guardian appointed to shield the towering cedars from reckless blades. When Enkidu hesitated at the threshold, their shared resolve steadied both hearts.',
        'As pale morning light broke across the terraced cliffs, the two heroes realized that lasting renown comes not merely from conquest, but from honoring the ancient covenant between human ambition and the living mountain.',
      ],
      id: [
        'Pada zaman ketika prasasti batu menyimpan ingatan tentang sungai-sungai besar, Gilgamesh dari Uruk dan sahabatnya Enkidu melangkah menuju Hutan Aras tinggi, tempat kabut perak beristirahat di antara batang pohon berlumut.',
        'Rimba itu tidak pernah sunyi; setiap embusan angin gunung membawa gema Humbaba, penjaga agung yang ditugaskan melindungi pepohonan suci dari kapak yang serakah. Saat Enkidu ragu di gerbang batu, keteguhan persahabatan menguatkan langkah mereka.',
        'Ketika cahaya pagi yang sejuk menyapu tebing bertingkat, kedua pahlawan memahami bahwa nama yang abadi lahir bukan hanya dari penaklukan, melainkan dari penghormatan terhadap keseimbangan alam semesta.',
      ],
      th: [
        'ในกาลครั้งที่ศิลาจารึกยังทำหน้าที่เก็บรักษาความทรงจำของสายน้ำ กิลกาเมชแห่งอูรุกและเอนคิดูสหายคู่ใจได้ออกเดินทางสู่ป่าสนซีดาร์อันสูงชัน ที่ซึ่งม่านเมฆสีเงินลอยอ้อยอิ่งอยู่ท่ามกลางลำต้นที่ปกคลุมด้วยมอสส์',
        'ผืนป่าแห่งนั้นมิได้เงียบงัน ทุกสายลมบนยอดเขาพัดพาเสียงก้องของฮุมบาบา ผู้พิทักษ์ที่ได้รับมอบหมายให้คุ้มครองต้นสนสูงตระหง่านจากคมขวานผู้บุกรุก เมื่อเอนคิดูชะงักงันที่ธรณีหิน พลังแห่งมิตรภาพได้ช่วยประคองใจทั้งสองให้มั่นคง',
        'ครั้นแสงรุ่งอรุณสีฟ้าเยือกเย็นทอประกายเหนือหน้าผา วีรบุรุษทั้งสองจึงตระหนักว่าเกียรติยศอันยืนยงไม่ได้เกิดจากการทำลายล้างเพียงอย่างเดียว หากเกิดจากการเคารพพันธสัญญาอันเก่าแก่ระหว่างมนุษย์กับขุนเขาที่มีชีวิต',
      ],
    },
    source: {
      title: {
        ar: 'ملحمة جلجامش — اللوح الخامس (صياغة تراثية حرة من الملك العام)',
        en: 'Epic of Gilgamesh — Tablet V (Original Public-Domain Retelling)',
        id: 'Epik Gilgamesh — Loh V (Saduran Bebas Domain Publik)',
        th: 'มหากาพย์กิลกาเมช — แผ่นจารึกที่ 5 (เรียบเรียงใหม่จากสมบัติสาธารณะ)',
      },
      author: {
        ar: 'تراث بلاد الرافدين القديم',
        en: 'Ancient Mesopotamian Tradition',
        id: 'Tradisi Mesopotamia Kuno',
        th: 'มรดกวรรณกรรมเมโสโปเตเมียโบราณ',
      },
      year: '2100 BCE',
    },
    image: '/images/pd-cedar.jpg',
    creatureIds: ['being-humbaba', 'being-anqa'],
    legacyCategory: 'places',
    isPublicDomain: true,
  },
  {
    id: 'pd-celestial-spheres',
    type: 'cosmology',
    culture: 'babylonian_arabian',
    region: {
      lat: 32.5364,
      lng: 44.4208,
      label: {
        ar: 'بابل وضفاف الفرات',
        en: 'Babylon & Banks of the Euphrates',
        id: 'Babilonia & Tepian Efrat',
        th: 'บาบิโลนและริมฝั่งแม่น้ำยูเฟรติส',
      },
    },
    tags: ['cosmos_order', 'sky_water', 'sacred_light'],
    title: {
      ar: 'الأفلاك السبعة وبحر السماء المعلّق',
      en: 'The Seven Spheres and the Suspended Celestial Sea',
      id: 'Tujuh Lapisan Langit dan Samudra Cakrawala',
      th: 'จักรวาลเจ็ดชั้นและมหานทีแห่งฟากฟ้า',
    },
    summary: {
      ar: 'قراءة كوسمولوجية في تصوّر القدماء للأفلاك الدوّارة والبحر العلوي الذي تجري فيه الكواكب كمراكب الفضة.',
      en: 'A cosmological meditation on ancient Near Eastern celestial rings and the upper waters crossed by luminous stars.',
      id: 'Renungan kosmologi tentang lingkaran langit Timur Dekat kuno dan lautan atas tempat bintang-bintang berlayar.',
      th: 'ภาพสะท้อนทางจักรวาลวิทยาโบราณว่าด้วยวงโคจรทั้งเจ็ดและผืนน้ำเบื้องบนที่ดวงดาวล่องลอยดุจนาวาสีเงิน',
    },
    text: {
      ar: [
        'تخيّل حكماء ما بين النهرين وبغداد القديمة أن السماء ليست فراغاً صامتاً، بل قبابٌ متداخلة من البلور والماء الساكن تدور بنظام هندسي دقيق فوق ضفاف الفرات الهادئة.',
        'في الفلك الأول يسبح القمر قياساً للشهور، وتليه مدارات الكواكب السيارة حتى الفلك السابع حيث تتراصّ البروج مثل نقوش على قوس معبد سماوي. وبين كل فلك وآخر بحرٌ رقيق يحجب وهج النور الأعظم عن عيون أهل الأرض.',
        'هكذا جمع الفلك التراثي بين رصد المنازل والنجوم وبين الخيال الشعري، ليجعل النظر إلى سماء الليل قراءةً في كتابٍ مفتوح عن الترتيب والسكينة.',
      ],
      en: [
        'Ancient stargazers along the Euphrates envisioned the heavens not as an empty void, but as seven concentric vaults of crystal and calm upper waters turning in measured harmony above the riverbanks.',
        'In the nearest sphere the crescent moon kept count of the months, followed by the wandering planets up to the seventh dome, where constellations arched like engravings across a celestial observatory. Between each ring lay a veiled sea tempering the brilliance above.',
        'In this way classical cosmology united patient observation of the night sky with poetic wonder, turning the heavens into a legible map of order and stillness.',
      ],
      id: [
        'Para ahli falak kuno di tepian Sungai Efrat membayangkan langit bukan sebagai ruang hampa, melainkan tujuh kubah kristal sepusat dan samudra tenang yang berputar selaras di atas bumi.',
        'Di lapisan terdekat, bulan sabit menandai pergantian bulan, disusul orbit bintang pengembara hingga kubah ketujuh tempat rasi bintang terukir bagai lengkung balai langit. Di antara setiap lapisan terbentang lautan bening yang melembutkan cahaya.',
        'Dengan cara itu, kosmologi klasik memadukan pengamatan teliti atas bintang malam dengan imajinasi puitis tentang keteraturan dan ketenangan semesta.',
      ],
      th: [
        'นักปราชญ์และโหราจารย์โบราณริมฝั่งแม่น้ำยูเฟรติสมิได้มองฟากฟ้าว่าเป็นความว่างเปล่า หากจินตนาการว่าเป็นโดมแก้วโปร่งแสงเจ็ดชั้นซ้อนทับกันและห้วงน้ำเบื้องบนที่หมุนเวียนอย่างเป็นระเบียบเหนือลำน้ำ',
        'ในชั้นแรกสุด ดวงจันทร์เสี้ยวทำหน้าที่นับคืนวันและเดือน ถัดออกไปคือวงโคจรของดาวเคราะห์ทั้งหลายจนถึงชั้นที่เจ็ด อันเป็นที่ประดับของกลุ่มดาวราวภาพสลักบนซุ้มประตูฟ้า ระหว่างแต่ละชั้นมีทะเลอันสงบนิ่งคอยกรองแสงจ้าไว้',
        'จักรวาลวิทยาโบราณจึงผสานการเฝ้าสังเกตดวงดาวเข้ากับจินตนาการเชิงกวี เปลี่ยนท้องฟ้ายามค่ำคืนให้กลายเป็นคัมภีร์แห่งความสมดุลและความสงบงาม',
      ],
    },
    source: {
      title: {
        ar: 'نصوص الفلك التراثية ومجسطي الشرق (صياغة معرفية من الملك العام)',
        en: 'Classical Near Eastern Celestial Lore (Original Public-Domain Synthesis)',
        id: 'Naskah Kosmologi Timur Dekat Klasik (Sintesis Domain Publik)',
        th: 'ตำราดาราศาสตร์และจักรวาลวิทยาตะวันออกใกล้โบราณ (เรียบเรียงใหม่)',
      },
      author: {
        ar: 'موروث الرصد الفلكي البابلي والعربي',
        en: 'Babylonian & Classical Arabic Astronomical Lore',
        id: 'Tradisi Astronomi Babilonia & Arab Klasik',
        th: 'มรดกโหราศาสตร์บาบิโลนและอาหรับคลาสสิก',
      },
      year: '850 CE',
    },
    image: '/images/pd-spheres.jpg',
    creatureIds: ['being-malik', 'being-kinnari'],
    legacyCategory: 'places',
    isPublicDomain: true,
  },
  {
    id: 'pd-juha-moon-well',
    type: 'story',
    culture: 'arabian',
    region: {
      lat: 33.3152,
      lng: 44.3661,
      label: {
        ar: 'فناء بغداد العتيقة، العراق',
        en: 'Old Baghdad Courtyard, Iraq',
        id: 'Pelataran Baghdad Lama, Irak',
        th: 'ลานบ้านเมืองเก่าแบกแดด อิรัก',
      },
    },
    tags: ['wisdom_wit', 'sky_water', 'night_journey'],
    title: {
      ar: 'جحا والقمر الساقط في البئر',
      en: 'Juha and the Moon Fallen into the Well',
      id: 'Juha dan Bulan yang Jatuh ke Dalam Sumur',
      th: 'ญุฮากับดวงจันทร์ที่ตกลงไปในบ่อน้ำ',
    },
    summary: {
      ar: 'طرفة شعبية ساخرة حين ظنّ جحا أن الهلال غرق في ماء البئر، فحاول انتشاله بدلوٍ وحبل تحت السماء الصافية.',
      en: 'A beloved folk tale in which Juha spots the crescent moon shimmering inside his courtyard well and tries to rescue it with a bucket.',
      id: 'Kisah rakyat jenaka ketika Juha melihat pantulan bulan sabit di dasar sumurnya dan berusaha menyelamatkannya dengan timba.',
      th: 'นิทานมุขตลกแฝงปัญญา เมื่อญุฮาเห็นเงาดวงจันทร์เสี้ยวส่องประกายในบ่อน้ำ จึงพยายามใช้ถังเชือกช่วยดึงขึ้นมา',
    },
    text: {
      ar: [
        'خرج جحا في ليلةٍ مقمرةٍ ليشرب من بئر الدار، فلما أطال النظر إلى سطح الماء الساكن أبصر هلالاً فضياً يتلألأ في القاع. فصاح في فناء الحارة: يا حسرتاه! لقد هوى القمر في بئرنا وانطفأت سماء المسافرين.',
        'أحضر حبلَه الطويل وربط الدلو بقوة، ثم أنزله متمهلاً حتى غاص في العتمة الزرقاء. وحين حاول الجذب، علقت حافة الدلو بنتوءٍ من حجارة البئر فثقل الحمل وشدّ جحا بكل ما أوتي من عزم.',
        'انفلت الحبل فجأة فسقط جحا على ظهره، وما إن فتح عينيه حتى رأى القمر ساطعاً بين النجوم فوق النخيل، فابتسم قائلاً: الحمد لله، لقد تعبتُ في انتشاله، لكنني أعدتُه إلى مكانه سالماً!',
      ],
      en: [
        'One still night, Juha stepped into his courtyard to draw water from the stone well. Peering down into the dark ripples, he saw a luminous crescent gleaming in the depths and gasped that the moon itself had tumbled out of the sky.',
        'Determined to restore light to night travelers, he tied a sturdy rope to his wooden bucket and lowered it gently into the blue water. As he tugged upward, the rim snagged firmly beneath a jutting stone inside the shaft.',
        'Pulling with all his strength, the rope suddenly slipped free and Juha tumbled backward onto the flagstones. Looking up, he beheld the bright crescent floating serenely above the date palms and sighed in relief: "That was exhausting, yet thank goodness I hoisted it safely back into place!"',
      ],
      id: [
        'Pada suatu malam yang hening, Juha melangkah ke pelataran rumah untuk menimba air dari sumur batu. Saat menatap permukaan air yang tenang, ia melihat bulan sabit perak berkilau di dasar sumur dan mengira bulan telah jatuh dari langit.',
        'Demi menyelamatkan penerang bagi para musafir malam, ia mengikatkan tali kuat pada timba kayu lalu menurunkannya perlahan ke air biru. Ketika ditarik ke atas, bibir timba tersangkut pada batu sumur yang menonjol.',
        'Dengan segenap tenaga ia menarik tali hingga tiba-tiba pegangan terlepas dan Juha terjatuh telentang di ubin halaman. Begitu menengadah, dilihatnya bulan sabit bersinar tenang di atas pohon kurma, lalu ia bergumam lega: "Melelahkan sekali, tetapi syukurlah bulan berhasil kukembalikan ke tempatnya!"',
      ],
      th: [
        'ในคืนอันเงียบสงบคืนหนึ่ง ญุฮาเดินออกไปยังลานบ้านเพื่อตักน้ำจากบ่อหิน เมื่อชะโงกมองลงไปในผิวน้ำที่นิ่งสงบ เขาเห็นเงาจันทร์เสี้ยวสีเงินส่องประกายอยู่ก้นบ่อ จึงตกใจคิดว่าดวงจันทร์ร่วงหล่นลงมาจากฟากฟ้าเสียแล้ว',
        'ด้วยความตั้งใจจะกอบกู้แสงสว่างให้แก่นักเดินทางยามราตรี เขาจึงผูกเชือกเส้นหนาเข้ากับถังไม้แล้วหย่อนลงไปในน้ำสีคราม ครั้นออกแรงดึงขึ้น ขอบถังกลับไปเกี่ยวติดกับก้อนหินที่ยื่นออกมาภายในผนังบ่อ',
        'ญุฮาออกแรงดึงสุดกำลังจนเชือกหลุดผึงและตัวเขาล้มหงายหลังลงบนลานหิน เมื่อเงยหน้าขึ้นมองท้องฟ้าเหนือยอดอินทผาลัม เขาก็เห็นดวงจันทร์ลอยเด่นอยู่กลางหมู่ดาว จึงถอนหายใจด้วยความโล่งอกพลางยิ้มว่า "เหนื่อยแทบแย่ แต่ดีเหลือเกินที่ช่วยดึงกลับขึ้นไปไว้ที่เดิมได้สำเร็จ!"',
      ],
    },
    source: {
      title: {
        ar: 'نوادر جحا التراثية (صياغة أدبية من الملك العام)',
        en: 'Classical Juha & Nasreddin Folktales (Public-Domain Retelling)',
        id: 'Kisah Hikmah Klasik Juha (Saduran Domain Publik)',
        th: 'นิทานพื้นบ้านคลาสสิกของญุฮา (เรียบเรียงใหม่จากสมบัติสาธารณะ)',
      },
      author: {
        ar: 'الأدب الشعبي العربي والشرقي',
        en: 'Arabian & Near Eastern Folk Wit',
        id: 'Sastra Rakyat Arab & Timur Dekat',
        th: 'คติชนอาหรับและตะวันออกใกล้',
      },
      year: '1300 CE',
    },
    image: '/images/pd-juha-well.jpg',
    creatureIds: ['being-jinn', 'being-ghul'],
    legacyCategory: 'personalities',
    isPublicDomain: true,
  },
  {
    id: 'pd-dewi-sri',
    type: 'folklore',
    culture: 'indonesian',
    region: {
      lat: -7.6079,
      lng: 110.2038,
      label: {
        ar: 'مدرجات جاوة الوسطى، إندونيسيا',
        en: 'Central Java Rice Terraces, Indonesia',
        id: 'Terasering Padi Jawa Tengah, Indonesia',
        th: 'นาขั้นบันไดชวากลาง ประเทศอินโดนีเซีย',
      },
    },
    tags: ['sacred_forest', 'cosmos_order', 'wisdom_wit'],
    title: {
      ar: 'ديوي سري وهبة سنابل الحياة في جاوة',
      en: 'Dewi Sri and the Blessing of the Living Harvest',
      id: 'Dewi Sri dan Berkah Kesuburan Padi Nusantara',
      th: 'เทวีศรีและพรแห่งรวงข้าวผู้หล่อเลี้ยงชีวิต',
    },
    summary: {
      ar: 'حكاية فلكلورية من الأرخبيل الإندونيسي عن رعاية الحقول والمياه المتدفقة وتكريم الأرض التي تطعم القرى.',
      en: 'An Indonesian archipelago folktale celebrating stewardship of terraced fields, mountain streams, and shared harvest gratitude.',
      id: 'Cerita rakyat Nusantara tentang keselarasan air pegunungan, sawah bertingkat, dan rasa syukur menjaga kesuburan bumi.',
      th: 'นิทานพื้นบ้านแห่งหมู่เกาะอินโดนีเซียว่าด้วยความสมดุลระหว่างสายน้ำจากขุนเขา นาขั้นบันได และความกตัญญูต่อผืนดิน',
    },
    text: {
      ar: [
        'بين ضباب الجبال في جاوة الوسطى، كانت القرى تروي حكاية ديوي سري حامية الحقول، التي علمت الفلاحين أن كل جدول ماءٍ ينزل من القمم يحمل عهداً بين السماء والأرض.',
        'حين حلّ الجفاف في أحد المواسم واختلفت القرى على مجاري القنوات، ظهرت في الأحلام إشارةٌ هادئة: لا ينمو السنبل في أرضٍ تنقطع عنها الرحمة أو يضيع فيها تقاسم الماء بالعدل.',
        'فتح الأهالي سدود الخيزران بالتساوي بين المدرجات العليا والسفلى، فعادت زهور اللوتس تتفتح على حواف البرك، وامتلأت البيوت بالخير، وبقيت القصة تُتلى في مواسم الغرس والحصاد.',
      ],
      en: [
        'Amid the morning mist of Central Java, villagers preserved the legend of Dewi Sri, guardian of living grain, who taught farmers that every mountain stream carries a quiet promise between sky and soil.',
        'During a season of drought when neighboring hamlets quarreled over irrigation channels, a calm reminder spread from house to house: green shoots wither wherever water is hoarded and flourish wherever care is shared.',
        'Opening the bamboo sluices equally from upper terraces to valley ponds, the communities watched pink lotuses bloom again beside crystal ripples, preserving the tale as a living ethic of stewardship.',
      ],
      id: [
        'Di tengah kabut pagi pegunungan Jawa Tengah, masyarakat mewarisi kisah Dewi Sri, penjaga benih kehidupan, yang mengajarkan bahwa setiap aliran sungai membawa janji keselarasan antara langit dan tanah.',
        'Ketika musim kemarau panjang membuat desa-desa berselisih soal saluran irigasi, muncul kesadaran bersama: tunas padi tidak akan tumbuh subur di ladang yang kehilangan keadilan dan kepedulian.',
        'Para petani pun membuka pintu air bambu secara merata dari teras atas hingga lembah di bawahnya. Teratai kembali mekar di tepi aliran jernih, dan kisah ini tetap hidup sebagai pedoman menjaga alam.',
      ],
      th: [
        'ท่ามกลางม่านหมอกยามเช้าแห่งขุนเขาชวากลาง ชาวบ้านสืบสานตำนานของเทวีศรี ผู้พิทักษ์เมล็ดพันธุ์แห่งชีวิต ผู้สอนให้ชาวนาตระหนักว่าสายน้ำทุกสายจากยอดเขาคือพันธสัญญาอันสงบงามระหว่างผืนฟ้าและแผ่นดิน',
        'ครั้นฤดูแล้งมาเยือนจนหมู่บ้านใกล้เคียงเกิดความขัดแย้งเรื่องร่องน้ำ คำเตือนอันอ่อนโยนได้แผ่ขยายไปทั่วทุกเรือนว่า ต้นกล้าสีเขียวไม่อาจเติบโตได้ในพื้นที่ที่ขาดความเมตตาและการแบ่งปันสายน้ำอย่างเป็นธรรม',
        'เมื่อชาวบ้านร่วมกันเปิดประตูกั้นน้ำไม้ไผ่อย่างเท่าเทียมจากนาขั้นบันไดเบื้องบนลงสู่เบื้องล่าง ดอกบัวสีชมพูก็กลับมาผลิบานริมธารใส และนิทานเรื่องนี้ยังคงอยู่เป็นคติสอนใจในการดูแลผืนแผ่นดินสืบมา',
      ],
    },
    source: {
      title: {
        ar: 'تراث جاوة الشعبي في الزراعة والماء (صياغة أصلية)',
        en: 'Javanese Agrarian Folklore Tradition (Original Retelling)',
        id: 'Tradisi Cerita Rakyat Jawa (Saduran Asli)',
        th: 'คติชนกสิกรรมแห่งเกาะชวา (เรียบเรียงใหม่)',
      },
      author: {
        ar: 'الفولكلور الإندونيسي التراثي',
        en: 'Indonesian Nusantara Folklore',
        id: 'Cerita Rakyat Nusantara',
        th: 'นิทานพื้นบ้านอินโดนีเซีย',
      },
      year: '1500 CE',
    },
    image: '/images/pd-dewi-rice.jpg',
    creatureIds: ['being-dewi-sri', 'being-naga-air'],
    legacyCategory: 'gods',
    isPublicDomain: true,
  },
  {
    id: 'pd-manohara-kinnari',
    type: 'story',
    culture: 'thai',
    region: {
      lat: 18.7883,
      lng: 98.9853,
      label: {
        ar: 'تلال هيمافان وشمال تايلاند',
        en: 'Himmapan Foothills & Northern Thailand',
        id: 'Perbukitan Himmapan & Thailand Utara',
        th: 'เชิงเขาหิมพานต์และภาคเหนือของไทย',
      },
    },
    tags: ['hero_quest', 'night_journey', 'wisdom_wit'],
    title: {
      ar: 'مانوهارا طائر الكيناري وبحيرة اللوتس',
      en: 'Manohara the Kinnari and the Lotus Lake',
      id: 'Manohara sang Kinnari dan Danau Teratai',
      th: 'มโนราห์แห่งกินรีและสระอโนดาต',
    },
    summary: {
      ar: 'حكاية تايلاندية كلاسيكية عن الشجاعة والوفاء، ورحلة عبور الجبال الشاهقة لاستعادة أجنحة الكيناري وحريتها.',
      en: 'A classic Southeast Asian tale of devotion and courage across misty limestone peaks to reunite the winged Kinnari with her homeland.',
      id: 'Kisah klasik Asia Tenggara tentang keberanian melintasi puncak berkabut demi memulihkan sayap kebebasan sang Kinnari.',
      th: 'วรรณกรรมคลาสสิกแห่งเอเชียตะวันออกเฉียงใต้ว่าด้วยความกล้าหาญและการเดินทางฝ่าขุนเขาในม่านหมอกเพื่อคืนสู่อิสรภาพของกินรี',
    },
    text: {
      ar: [
        'على ضفاف بحيرة اللوتس المحفوفة بقمم هيمافان الزرقاء، كانت الكيناري مانوهارا تحلّق كل فجر بين الشلالات الفضية، كائنٌ يجمع رشاقة الطير ووقار الإنسان.',
        'حين أبعدتها مكيدةٌ في البلاط البعيد وأُجبر الأمير سوتون على اجتياز سبع عقباتٍ جبلية، لم يستعمل سلاحاً بل استرشد بأغنية الماء وصبرِ السالكين حتى بلغ وادي الغيوم.',
        'وعندما نُطقت الحقيقة أمام حشد الجبال، عادت الأجنحة إلى حريتها وبقيت القصة رمزاً في المسرح والرقص التايلاندي بأن الإخلاص يفتح أصعب الطرق.',
      ],
      en: [
        'Along the calm lotus lake cradled by the blue limestone peaks of Himmapan, Manohara the Kinnari glided at twilight beside silver waterfalls—a luminous being half-human, half-winged spirit.',
        'When intrigue separated her from her companions and Prince Suton set out across seven perilous passes to find her, he carried no sword—only patience, keen listening, and tokens left along the mountain path.',
        'At the journey’s end, truth reconciled the two realms and restored Manohara’s flight, inspiring centuries of classical dance and storytelling across Thailand.',
      ],
      id: [
        'Di tepian danau teratai yang dikelilingi puncak batu kapur biru Himmapan, Manohara sang Kinnari meluncur anggun di senja hari di sisi air terjun perak—makhluk bersayap yang memadukan keluwesan burung dan budi manusia.',
        'Ketika intrik memisahkannya dari tanah kelahiran dan Pangeran Suton menempuh tujuh lintasan gunung berkabut untuk mencarinya, sang pangeran hanya berbekal kesabaran, ketulusan, serta petunjuk alam.',
        'Di ujung perjalanan, kebenaran menyatukan kembali dua dunia dan mengembalikan kebebasan terbang Manohara, menginspirasi seni tari dan sastra klasik Thailand sepanjang masa.',
      ],
      th: [
        'ริมสระบัวอันสงบเงียบที่โอบล้อมด้วยยอดเขาหินปูนสีครามแห่งป่าหิมพานต์ นางกินรีมโนราห์โผบินเคียงข้างสายน้ำตกสีเงินยามพลบค่ำ เธอคืออมนุษย์ผู้ผสานความสง่างามของมนุษย์เข้ากับปีกอันพลิ้วไหวแห่งเวหา',
        'เมื่ออุบายทำให้เธอต้องพลัดพรากจากบ้านเกิด และพระสุธนต้องออกเดินทางฝ่าด่านขุนเขาอันทุรกันดารเจ็ดชั้นเพื่อตามหา พระองค์มิได้พกพาอาวุธใด หากอาศัยความอดทน ความจริงใจ และร่องรอยแห่งธรรมชาติเป็นผู้นำทาง',
        'ณ ปลายทางแห่งการพิสูจน์ใจ ความจริงได้เชื่อมประสานสองดินแดนและคืนอิสรภาพแห่งการโบยบินแก่มโนราห์ กลายเป็นแรงบันดาลใจแห่งนาฏศิลป์และวรรณกรรมไทยสืบต่อมาหลายศตวรรษ',
      ],
    },
    source: {
      title: {
        ar: 'مختارات الحكايات التراثية التايلاندية (بانياسا جاتاكا — صياغة عامة)',
        en: 'Pannasa Jataka & Classical Thai Folklore (Public-Domain Retelling)',
        id: 'Cerita Rakyat Klasik Thailand Pannasa Jataka (Saduran Domain Publik)',
        th: 'ปัญญาสชาดกและนิทานพื้นบ้านไทยคลาสสิก (เรียบเรียงใหม่)',
      },
      author: {
        ar: 'الموروث الأدبي التايلاندي',
        en: 'Classical Thai Literary Heritage',
        id: 'Warisan Sastra Thailand Klasik',
        th: 'มรดกวรรณกรรมไทยโบราณ',
      },
      year: '1600 CE',
    },
    image: '/images/pd-kinnari-lake.jpg',
    creatureIds: ['being-kinnari', 'being-anqa'],
    legacyCategory: 'creatures',
    isPublicDomain: true,
  },
];
