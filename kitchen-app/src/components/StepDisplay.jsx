// ============================================================
//  src/components/StepDisplay.jsx
//  תצוגת שלב בודד – מציגה את כל הפרטים בהתאם לסוג השלב.
//  משמשת גם בדף פרטי מתכון וגם במסך הסקירה של האשף.
//
//  סוגי שלבים:
//    ADD         – רכיבים בלבד
//    MIX         – מהירות + זמן
//    MIX_ADD     – מהירות + רכיבים + זמן נוסף
//    WHIP        – הקצפה (סוג קצף, חומר, מהירות)
//    WHIP_ADD    – הקצפה + רכיבים + זמן נוסף
//    INSTRUCTION – טקסט הוראה חופשי
//    FINISH      – סיום
// ============================================================
import React from 'react';
import { STEP_TYPES, STEP_COLORS } from '../utils/constants';

export default function StepDisplay({
  step,         // אובייקט השלב מהמתכון
  index,        // מספר סידורי (0-based)
  getIngName,   // פונקציית חיפוש שם רכיב
  getUnitName,  // פונקציית חיפוש שם יחידה
  getFoamName,  // פונקציית חיפוש שם סוג קצף
}) {
  // מציאת המטא-דאטה של סוג השלב
  const info = STEP_TYPES.find((t) => t.val === step.type);

  return (
    <div style={{
      display: 'flex', gap: 16, marginBottom: 16,
      padding: '16px 18px', borderRadius: 12,
      border: '1px solid #F3F4F6',
      background: (STEP_COLORS[step.type] || '#ddd') + '08',
    }}>
      {/* עיגול מספר שלב */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: STEP_COLORS[step.type] || '#ddd', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, flexShrink: 0,
      }}>
        {index + 1}
      </div>

      {/* תוכן השלב */}
      <div style={{ flex: 1 }}>
        {/* כותרת סוג השלב */}
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
          {info?.icon} {info?.label || step.type}
        </div>

        {/* ── הוספת רכיבים ── */}
        {step.type === 'ADD' && step.ingredients && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {step.ingredients.map((ing, j) => (
              <span key={j} style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0',
                borderRadius: 8, padding: '4px 10px', fontSize: 13,
              }}>
                {ing.amount} {getUnitName(ing.unitId)} {getIngName(ing.ingredientId)}
              </span>
            ))}
          </div>
        )}

        {/* ── ערבוב ── */}
        {step.type === 'MIX' && (
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            מהירות: {step.motorSpeed} | זמן: {step.durationSec} שניות
          </div>
        )}

        {/* ── ערבוב + הוספה ── */}
        {step.type === 'MIX_ADD' && (
          <>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
              מהירות: {step.motorSpeed} | זמן נוסף: {step.durationSec || 0} שניות
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {step.ingredients?.map((ing, j) => (
                <span key={j} style={{
                  background: '#EEF2FF', border: '1px solid #C7D2FE',
                  borderRadius: 8, padding: '4px 10px', fontSize: 13,
                }}>
                  {ing.amount} {getUnitName(ing.unitId)} {getIngName(ing.ingredientId)}
                </span>
              ))}
            </div>
          </>
        )}

        {/* ── הקצפה ── */}
        {step.type === 'WHIP' && (
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            סוג קצף: {getFoamName(step.foamTypeId)} |
            חומר: {step.foamAmount} {getUnitName(step.foamUnitId)} {getIngName(step.foamIngredientId)} |
            מהירות: {step.motorSpeed}
          </div>
        )}

        {/* ── הקצפה + הוספה ── */}
        {step.type === 'WHIP_ADD' && (
          <>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
              סוג קצף: {getFoamName(step.foamTypeId)} |
              חומר: {step.foamAmount} {getUnitName(step.foamUnitId)} {getIngName(step.foamIngredientId)} |
              מהירות: {step.motorSpeed} | זמן נוסף: {step.durationSec || 0} שניות
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {step.ingredients?.map((ing, j) => (
                <span key={j} style={{
                  background: '#FFF7ED', border: '1px solid #FED7AA',
                  borderRadius: 8, padding: '4px 10px', fontSize: 13,
                }}>
                  {ing.amount} {getUnitName(ing.unitId)} {getIngName(ing.ingredientId)}
                </span>
              ))}
            </div>
          </>
        )}

        {/* ── הוראה טקסטואלית ── */}
        {step.type === 'INSTRUCTION' && (
          <div style={{
            fontSize: 14, color: '#4B5563', fontStyle: 'italic',
            background: '#F5F3FF', padding: '8px 12px', borderRadius: 8,
            direction: 'ltr', textAlign: 'right',
          }}>
            "{step.instructionText}"
          </div>
        )}

        {/* ── סיום ── */}
        {step.type === 'FINISH' && (
          <div style={{ fontSize: 13, color: '#6B7280' }}>סיום המתכון</div>
        )}
      </div>
    </div>
  );
}
