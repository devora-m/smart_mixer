// ============================================================
//  src/utils/styles.js
//  אובייקטי style משותפים – מרוכזים כאן למניעת כפילויות
// ============================================================

// שדה קלט כללי (input / select)
export const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
};

// כפתור ראשי (פעולה עיקרית – שמירה, המשך)
export const btnPrimary = {
  padding: '11px 22px',
  borderRadius: 8,
  border: 'none',
  background: '#C4883A',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// כפתור משני (ביטול, חזרה)
export const btnSecondary = {
  padding: '11px 22px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  background: '#fff',
  color: '#6B7280',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// כפתור קטן (הזזה / מחיקה של שלב)
export const smallBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid #E5E7EB',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6B7280',
  padding: 0,
};
