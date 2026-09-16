// ============================================================
//  src/components/FilterBar.jsx
//  פס סינון עליון – כולל:
//  • חיפוש חופשי לפי שם (עברית/אנגלית)
//  • סינון לפי קטגוריה
//  • סינון לפי רמת קושי
//  • מונה תוצאות
// ============================================================
import React from 'react';
import { CATEGORIES, DIFFICULTIES } from '../utils/constants';

export default function FilterBar({
  search,      setSearch,
  catFilter,   setCatFilter,
  diffFilter,  setDiffFilter,
  resultCount, // מספר תוצאות לאחר סינון
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 22px',
      marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
    }}>
      {/* חיפוש חופשי */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 חיפוש מתכון..."
        style={{
          flex: '1 1 220px', padding: '10px 16px', borderRadius: 8,
          border: '1px solid #E5E7EB', fontSize: 15, fontFamily: 'inherit',
          outline: 'none',
        }}
      />

      {/* סינון לפי קטגוריה */}
      <select
        value={catFilter}
        onChange={(e) => setCatFilter(e.target.value)}
        style={{
          padding: '10px 14px', borderRadius: 8,
          border: '1px solid #E5E7EB', fontSize: 14,
          fontFamily: 'inherit', background: '#fff', cursor: 'pointer',
        }}
      >
        <option value="">כל הקטגוריות</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* סינון לפי רמת קושי */}
      <select
        value={diffFilter}
        onChange={(e) => setDiffFilter(e.target.value)}
        style={{
          padding: '10px 14px', borderRadius: 8,
          border: '1px solid #E5E7EB', fontSize: 14,
          fontFamily: 'inherit', background: '#fff', cursor: 'pointer',
        }}
      >
        <option value="">כל הרמות</option>
        {DIFFICULTIES.map((d) => (
          <option key={d.val} value={d.val}>{d.emoji} {d.label}</option>
        ))}
      </select>

      {/* מונה תוצאות */}
      <div style={{ fontSize: 13, color: '#6B7280' }}>
        {resultCount} מתכונים
      </div>
    </div>
  );
}
