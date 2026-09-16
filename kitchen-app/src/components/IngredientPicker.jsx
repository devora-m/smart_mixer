// ============================================================
//  src/components/IngredientPicker.jsx
//  בורר רכיבים – משמש בשלבי ADD, MIX_ADD, WHIP_ADD.
//
//  עיקרון מפתח: אין טקסט חופשי!
//  • הרכיב נבחר מתוך dropdown שמכיל רק רכיבים מ-SQLite
//  • היחידה נבחרת מתוך dropdown שמכיל רק יחידות מ-SQLite
//  • הכמות – שדה מספרי בלבד
//
//  כך מובטח שכל רכיב שנכנס למתכון קיים במסד הנתונים.
// ============================================================
import React from 'react';
import Field from './Field';
import { inputStyle } from '../utils/styles';

export default function IngredientPicker({
  ingredients,       // רשימת כל הרכיבים מ-SQLite
  units,             // רשימת כל היחידות מ-SQLite
  ingList,           // רכיבים שכבר נבחרו (מערך)
  addIngredient,     // פונקציה להוספת רכיב
  removeIngredient,  // פונקציה להסרת רכיב
  curIng,    setCurIng,     // מזהה הרכיב הנוכחי בטופס
  curUnit,   setCurUnit,    // מזהה היחידה הנוכחית בטופס
  curAmount, setCurAmount,  // כמות נוכחית בטופס
  getIngName,        // תרגום מזהה → שם רכיב
  getUnitName,       // תרגום מזהה → שם יחידה
}) {
  return (
    <div>
      {/* ─── רכיבים שכבר נבחרו ─── */}
      {ingList.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ingList.map((ing, i) => (
            <span key={i} style={{
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              borderRadius: 8, padding: '6px 12px', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {/* תצוגה: כמות + יחידה + שם רכיב */}
              {ing.amount} {getUnitName(ing.unitId)} {getIngName(ing.ingredientId)}

              {/* כפתור הסרה */}
              <button
                onClick={() => removeIngredient(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#EF4444', fontSize: 14, padding: 0,
                }}
              >✕</button>
            </span>
          ))}
        </div>
      )}

      {/* ─── טופס הוספת רכיב חדש ─── */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        {/* בחירת רכיב – dropdown מ-SQLite */}
        <Field label="רכיב" style={{ flex: '1 1 140px' }}>
          <select
            value={curIng}
            onChange={(e) => setCurIng(e.target.value)}
            style={inputStyle}
          >
            <option value="">בחר רכיב</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
        </Field>

        {/* בחירת יחידה – dropdown מ-SQLite */}
        <Field label="יחידה" style={{ flex: '1 1 100px' }}>
          <select
            value={curUnit}
            onChange={(e) => setCurUnit(e.target.value)}
            style={inputStyle}
          >
            <option value="">בחר יחידה</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </Field>

        {/* כמות – שדה מספרי */}
        <Field label="כמות" style={{ flex: '0 0 90px' }}>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={curAmount}
            onChange={(e) => setCurAmount(e.target.value)}
            placeholder="2"
            style={inputStyle}
          />
        </Field>

        {/* כפתור הוספה – פעיל רק אם כל השדות מלאים */}
        <button
          onClick={addIngredient}
          disabled={!curIng || !curUnit || !curAmount}
          style={{
            padding: '10px 16px', borderRadius: 8, border: 'none',
            background: curIng && curUnit && curAmount ? '#10b981' : '#D1D5DB',
            color: '#fff',
            cursor: curIng && curUnit && curAmount ? 'pointer' : 'not-allowed',
            fontWeight: 700, fontSize: 18, height: 42, fontFamily: 'inherit',
          }}
        >+</button>
      </div>
    </div>
  );
}
