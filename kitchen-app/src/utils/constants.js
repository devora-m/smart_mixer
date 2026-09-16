// ============================================================
//  src/utils/constants.js
//  קבועים גלובליים – משותפים לכל הקומפוננטות
// ============================================================

// כתובת ברירת מחדל של השרת
export const DEFAULT_API = 'http://localhost:4000';

// קטגוריות מתכונים – חייב להתאים ל-CATEGORIES בסכמת MongoDB
export const CATEGORIES = ['עוגות', 'עוגיות', 'לחמים', 'קינוחים'];

// צבע מותאם לכל קטגוריה – לתצוגה בכרטיסיות
export const CATEGORY_COLORS = {
  'עוגות':   '#E11D48',
  'עוגיות':  '#D97706',
  'לחמים':   '#059669',
  'קינוחים': '#7C3AED',
};

// רמות קושי 1–3
export const DIFFICULTIES = [
  { val: 1, label: 'קל',    emoji: '⭐' },
  { val: 2, label: 'בינוני', emoji: '⭐⭐' },
  { val: 3, label: 'קשה',   emoji: '⭐⭐⭐' },
];

// סוגי שלבים – חייב להתאים ל-STEP_TYPES בסכמת MongoDB
export const STEP_TYPES = [
  { val: 'ADD',         label: 'הוספת רכיבים',    icon: '➕',   desc: 'הוספת חומרים לקערה' },
  { val: 'MIX',         label: 'ערבוב',           icon: '🔄',   desc: 'ערבוב בלבד' },
  { val: 'MIX_ADD',     label: 'ערבוב + הוספה',   icon: '🔄➕', desc: 'ערבוב תוך הוספת רכיבים' },
  { val: 'WHIP',        label: 'הקצפה',           icon: '🫧',   desc: 'הקצפה עד לגובה מטרה' },
  { val: 'WHIP_ADD',    label: 'הקצפה + הוספה',   icon: '🫧➕', desc: 'הקצפה ואז הוספת רכיבים' },
  { val: 'INSTRUCTION', label: 'הוראה',           icon: '📝',   desc: 'הוראה טקסטואלית' },
  { val: 'FINISH',      label: 'סיום',            icon: '✅',   desc: 'סיום המתכון' },
];

// צבע מותאם לכל סוג שלב – לתצוגה בעיגולים ובכרטיסיות
export const STEP_COLORS = {
  ADD:         '#10b981',
  MIX:         '#3b82f6',
  MIX_ADD:     '#6366f1',
  WHIP:        '#f59e0b',
  WHIP_ADD:    '#f97316',
  INSTRUCTION: '#8b5cf6',
  FINISH:      '#ef4444',
};
