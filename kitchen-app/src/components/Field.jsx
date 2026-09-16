// ============================================================
//  src/components/Field.jsx
//  קומפוננטת עטיפה לשדה טופס – מציגה תווית (label) מעל התוכן
//  משמשת בטפסי הוספת מתכון ועריכת שלבים
// ============================================================
import React from 'react';

export default function Field({ label, required, children, style }) {
  return (
    <div style={style}>
      {/* תווית השדה */}
      <label style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 5,
        color: '#374151',
      }}>
        {label}
        {/* כוכבית אדומה לשדות חובה */}
        {required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>

      {/* התוכן – input / select / כל אלמנט אחר */}
      {children}
    </div>
  );
}
