//  src/components/RecipeCard.jsx
//  כרטיסיית מתכון – מוצגת בגריד בדף הבית.
//  כוללת: שם, קטגוריה, זמן הכנה, מנות, קושי, קוד,
//  ועיגולים צבעוניים שמייצגים את סוגי השלבים.
import React from 'react';
import { DIFFICULTIES, STEP_COLORS, CATEGORY_COLORS } from '../utils/constants';

export default function RecipeCard({ recipe, onClick }) {
  // צבע הפס העליון והתווית – לפי קטגוריה
  const color = CATEGORY_COLORS[recipe.category] || '#C4883A';

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        overflow: 'hidden', border: '1px solid #F3F4F6',
      }}
      // אפקט hover
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
      }}
    >
      {/* פס צבעוני עליון – צבע לפי קטגוריה */}
      <div style={{ height: 6, background: color }} />

      <div style={{ padding: '18px 20px' }}>
        {/* שורה ראשונה: שם + תווית קטגוריה */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 10,
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {recipe.name}
          </h3>
          <span style={{
            background: color + '18', color,
            padding: '3px 10px', borderRadius: 20,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {recipe.category}
          </span>
        </div>

        {/* שם באנגלית */}
        <div style={{
          fontSize: 13, color: '#9CA3AF', marginBottom: 14,
          direction: 'ltr', textAlign: 'right',
        }}>
          {recipe.nameEn}
        </div>

        {/* מטא-דאטה: זמן, מנות, קושי, קוד */}
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280' }}>
          <span>⏱ {recipe.prepTimeMin} דק׳</span>
          <span>🍽 {recipe.baseServings} מנות</span>
          <span>{DIFFICULTIES.find((d) => d.val === recipe.difficulty)?.emoji}</span>
          <span style={{ marginRight: 'auto', color: '#C4883A', fontWeight: 600 }}>
            #{recipe.code}
          </span>
        </div>

        {/* עיגולי שלבים – כל עיגול מייצג שלב בצבע הסוג שלו */}
        <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {recipe.steps.map((s, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: STEP_COLORS[s.type] || '#ddd', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700,
            }}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
