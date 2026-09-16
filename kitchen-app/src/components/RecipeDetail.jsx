// ============================================================
//  src/components/RecipeDetail.jsx
//  דף פרטי מתכון – מציג:
//  • כותרת עם שם, קטגוריה, זמן, מנות, קושי, קוד
//  • רשימת כל השלבים בפירוט מלא (דרך StepDisplay)
// ============================================================
import React from 'react';
import { DIFFICULTIES } from '../utils/constants';
import StepDisplay from './StepDisplay';

export default function RecipeDetail({
  recipe,      // אובייקט המתכון המלא
  getIngName,  // חיפוש שם רכיב
  getUnitName, // חיפוש שם יחידה
  getFoamName, // חיפוש שם סוג קצף
  onBack,      // חזרה לרשימה
}) {
  // מציאת תווית רמת הקושי
  const diff = DIFFICULTIES.find((d) => d.val === recipe.difficulty);

  return (
    <div>
      {/* כפתור חזרה */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 14, color: '#C4883A', fontWeight: 600,
        marginBottom: 16, padding: 0, fontFamily: 'inherit',
      }}>
        → חזרה לרשימה
      </button>

      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        {/* ─── כותרת ─── */}
        <div style={{
          background: 'linear-gradient(135deg, #2C3E50, #34495E)',
          color: '#fff', padding: '28px 30px',
        }}>
          {/* שם + קוד */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
                {recipe.name}
              </h1>
              <div style={{
                fontSize: 15, opacity: 0.7, marginTop: 4,
                direction: 'ltr', textAlign: 'right',
              }}>
                {recipe.nameEn}
              </div>
            </div>
            <div style={{
              background: '#C4883A', padding: '8px 16px',
              borderRadius: 10, fontSize: 22, fontWeight: 800,
            }}>
              #{recipe.code}
            </div>
          </div>

          {/* מטא-דאטה */}
          <div style={{
            display: 'flex', gap: 24, marginTop: 18,
            fontSize: 14, flexWrap: 'wrap',
          }}>
            <span>📂 {recipe.category}</span>
            <span>⏱ {recipe.prepTimeMin} דקות</span>
            <span>🍽 {recipe.baseServings} מנות</span>
            <span>{diff?.emoji} {diff?.label}</span>
          </div>
        </div>

        {/* ─── רשימת שלבים ─── */}
        <div style={{ padding: '24px 30px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>
            שלבי המתכון
          </h2>
          {recipe.steps.map((step, i) => (
            <StepDisplay
              key={i}
              step={step}
              index={i}
              getIngName={getIngName}
              getUnitName={getUnitName}
              getFoamName={getFoamName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
