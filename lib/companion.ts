import type { CompanionSuggestion } from '@/types';

/**
 * Pendamping di vibeS BUKAN terapis dan BUKAN tenaga medis.
 * Mesin di bawah ini hanya mencocokkan pola kata, lalu membalas dengan
 * kalimat suportif yang sudah disiapkan. Tidak ada model AI di sini,
 * tidak ada data yang dikirim ke server, dan percakapan tidak disimpan.
 *
 * Kalau pengguna mengungkapkan pikiran menyakiti diri, balasan krisis
 * dan kartu bantuan selalu ditampilkan.
 */

export const CRISIS_INFO = {
  phoneLabel: '119 lalu tekan 8',
  phoneHref: 'tel:119',
  siteLabel: 'healing119.id',
  siteHref: 'https://healing119.id',
  note: 'Layanan Healing119 dari Kemenkes, gratis, 24 jam.',
} as const;

export const BREATH_PHASES = [
  { label: 'Tarik napas', seconds: 4 },
  { label: 'Tahan', seconds: 4 },
  { label: 'Buang napas', seconds: 6 },
] as const;

export const BREATH_CYCLES = 4;

const CRISIS_PATTERNS = [
  /bunuh diri/,
  /mengakhiri hidup/,
  /akhiri hidup/,
  /tidak mau hidup/,
  /nggak mau hidup/,
  /gak mau hidup/,
  /tidak ingin hidup/,
  /ingin mati/,
  /pengen mati/,
  /mau mati/,
  /lebih baik mati/,
  /menyakiti diri/,
  /sakiti diri/,
  /melukai diri/,
  /self[- ]?harm/,
];

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PATTERNS.some((pattern) => pattern.test(lower));
}

export const CRISIS_REPLY =
  'Terima kasih sudah cerita sejujur itu. Kalau pikiran itu terasa kuat sekarang, kamu tidak harus menghadapinya sendirian. Hubungi 119 lalu tekan 8, itu layanan Healing119 dari Kemenkes, gratis dan 24 jam. Kalau ada orang yang kamu percaya di dekatmu, ceritakan ke dia sekarang juga.';

interface Pattern {
  id: string;
  match: RegExp;
  suggestion: CompanionSuggestion | null;
  replies: string[];
}

const PATTERNS: Pattern[] = [
  {
    id: 'greeting',
    match: /^(halo|hai|hei|selamat (pagi|siang|sore|malam)|pagi|siang|sore|malam)\b/,
    suggestion: null,
    replies: [
      'Halo, senang kamu mampir. Di sini tempatnya pelan-pelan saja. Cerita sedikit, apa yang sedang kamu rasakan hari ini?',
      'Halo. Aku di sini untuk mendengarkan. Tidak ada jawaban yang salah, cerita saja semaumu.',
    ],
  },
  {
    id: 'sad',
    match: /sedih|kecewa|patah hati|nangis|menangis|galau|hampa|murung|sedih banget/,
    suggestion: 'music',
    replies: [
      'Kedengarannya harimu sedang berat. Wajar merasa sedih, tidak perlu buru-buru menghilangkannya. Mau duduk sebentar dengan satu lagu favoritmu?',
      'Aku dengar kamu. Sedih itu bukan kelemahan, itu tanda kamu peduli. Kalau mau, putar lagu yang menenangkan, atau buka foto yang bikin kamu sedikit lega.',
    ],
  },
  {
    id: 'anxious',
    match: /cemas|khawatir|takut|panik|gelisah|deg-degan|overthinking|banyak pikiran|was-was/,
    suggestion: 'breathing',
    replies: [
      'Pikiran yang berputar-putar itu melelahkan. Coba kita pelankan dulu napasnya bersama, satu tarikan, satu buangan. Aku yang pandu.',
      'Aku paham rasanya. Saat cemas, tubuh ikut tegang. Latihan napas sebentar bisa membantu. Mau coba empat putaran saja?',
    ],
  },
  {
    id: 'angry',
    match: /marah|kesal|kesel|jengkel|benci|sebal|dongkol/,
    suggestion: 'breathing',
    replies: [
      'Wajar kamu marah, pasti ada alasannya. Tidak apa-apa merasakannya. Kalau mau, tarik napas dulu bersamaku, baru cerita apa yang terjadi.',
      'Aku dengar kamu. Marah itu sinyal bahwa ada sesuatu yang penting buatmu. Cerita saja, aku tidak menghakimi.',
    ],
  },
  {
    id: 'tired',
    match: /lelah|capek|stres|stress|penat|burnout|jenuh|letih|capek banget/,
    suggestion: 'breathing',
    replies: [
      'Kamu sudah berusaha banyak hari ini. Istirahat itu bukan berhenti, itu bagian dari jalan. Mau latihan napas sebentar, lalu lanjut istirahat?',
      'Kedengarannya tenagamu sudah menipis. Tidak apa-apa memperlambat. Duduk sebentar, tarik napas, dan biarkan dirimu beristirahat.',
    ],
  },
  {
    id: 'lonely',
    match: /sendiri|kesepian|sepi|sendirian|tidak ada yang|nggak ada yang|gak ada yang/,
    suggestion: 'photo',
    replies: [
      'Kesepian itu berat, apalagi saat semua terasa jauh. Kamu tidak sendirian di sini. Kalau mau, buka photo book dan lihat foto orang atau momen yang kamu sayang.',
      'Aku di sini menemanimu. Kadang melihat kembali momen hangat, walau hanya dari foto, bisa sedikit meringankan. Mau coba?',
    ],
  },
  {
    id: 'failure',
    match: /gagal|tidak bisa|nggak bisa|gak bisa|bodoh|tidak berguna|menyerah|tidak ada gunanya/,
    suggestion: 'music',
    replies: [
      'Satu kegagalan tidak menghapus semua usahamu. Kamu masih di sini, masih mencoba, dan itu sudah berarti. Cerita sedikit, apa yang tidak berjalan seperti harapanmu?',
      'Aku paham perasaan itu. Tapi nilai kamu tidak ditentukan satu hari yang buruk. Kalau mau, istirahat dulu dengan lagu favoritmu, lalu kita lihat lagi pelan-pelan.',
    ],
  },
  {
    id: 'sleep',
    match: /susah tidur|tidak bisa tidur|insomnia|nggak bisa tidur|gak bisa tidur|begadang/,
    suggestion: 'breathing',
    replies: [
      'Susah tidur itu menyebalkan, apalagi kalau pikiran tidak mau diam. Coba latihan napas beberapa putaran, dengan cahaya redup dan lagu yang pelan. Mau aku pandu?',
      'Malam memang suka membesarkan semua pikiran. Tarik napas yang panjang dan pelan, buang pelan-pelan. Kita lakukan empat putaran bersama.',
    ],
  },
  {
    id: 'thanks',
    match: /makasih|terima kasih|thanks|thank you|terimakasih/,
    suggestion: null,
    replies: [
      'Sama-sama. Aku senang bisa menemani. Kalau nanti butuh lagi, aku ada di sini.',
      'Dengan senang hati. Jaga dirimu baik-baik, ya.',
    ],
  },
];

const FALLBACK_REPLIES = [
  'Aku dengar kamu. Cerita sedikit lagi, apa yang paling terasa berat sekarang?',
  'Terima kasih sudah berbagi. Aku di sini, tidak ke mana-mana. Mau cerita lebih lanjut, atau istirahat dulu dengan napas atau lagu?',
  'Kedengarannya itu tidak mudah. Tidak apa-apa merasa seperti itu. Kalau mau, kita bisa coba latihan napas sebentar.',
];

export interface CompanionReply {
  text: string;
  suggestion: CompanionSuggestion | null;
  crisis: boolean;
}

export function replyFor(text: string, turn: number): CompanionReply {
  if (detectCrisis(text)) {
    return { text: CRISIS_REPLY, suggestion: null, crisis: true };
  }
  const lower = text.toLowerCase();
  for (const pattern of PATTERNS) {
    if (pattern.match.test(lower)) {
      const reply = pattern.replies[turn % pattern.replies.length];
      return { text: reply, suggestion: pattern.suggestion, crisis: false };
    }
  }
  return {
    text: FALLBACK_REPLIES[turn % FALLBACK_REPLIES.length],
    suggestion: null,
    crisis: false,
  };
}
