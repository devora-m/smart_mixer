// ============================================================
//  src/components/WhipFields.jsx
//  שדות הקצפה – משמשים בשלבי WHIP ו-WHIP_ADD.
//
//  כל הבחירות מתוך dropdown של SQLite:
//  • סוג קצף (foamTypes) – חלמון, חלבון, שמנת, קצפת, ביצה שלמה
//  • חומר להקצפה (ingredients) – הרכיב שמוקצף
//  • יחידה (units) – מ"ל, גרם, וכו'
//  • מהירות מנוע – סליידר 1-10
//  • כמות – שדה מספרי
// ============================================================
import React from 'react';
import Field from './Field';
import { inputStyle } from '../utils/styles';

export default function WhipFields({
  foamTypes,    // רשימת סוגי קצף מ-SQLite
  ingredients,  // רשימת רכיבים מ-SQLite
  units,        // רשימת יחידות מ-SQLite
  motorSpeed,   setMotorSpeed,   // מהירות מנוע (1-10)
  foamType,     setFoamType,     // מזהה סוג קצף
  foamIng,      setFoamIng,      // מזהה חומר להקצפה
  foamUnit,     setFoamUnit,     // מזהה יחידת מידה
  foamAmount,   setFoamAmount,   // כמות חומר
  color,        // צבע accent לסליידר
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    }}>
      {/* מהירות מנוע – סליידר ויזואלי */}
      <Field label="מהירות מנוע (1-10)">
        <input
          type="range" min="1" max="10"
          value={motorSpeed}
          onChange={(e) => setMotorSpeed(e.target.value)}
          style={{ width: '100%' }}
        />
        <div style={{
          textAlign: 'center', fontWeight: 700,
          fontSize: 20, color,
        }}>
          {motorSpeed}
        </div>
      </Field>

      {/* סוג קצף – dropdown מ-SQLite */}
      <Field label="סוג קצף">
        <select
          value={foamType}
          onChange={(e) => setFoamType(e.target.value)}
          style={inputStyle}
        >
          <option value="">בחר סוג קצף</option>
          {foamTypes.map((ft) => (
            <option key={ft.id} value={ft.id}>{ft.name}</option>
          ))}
        </select>
      </Field>

      {/* חומר להקצפה – dropdown מ-SQLite */}
      <Field label="חומר להקצפה">
        <select
          value={foamIng}
          onChange={(e) => setFoamIng(e.target.value)}
          style={inputStyle}
        >
          <option value="">בחר חומר</option>
          {ingredients.map((ing) => (
            <option key={ing.id} value={ing.id}>{ing.name}</option>
          ))}
        </select>
      </Field>

      {/* יחידה – dropdown מ-SQLite */}
      <Field label="יחידה">
        <select
          value={foamUnit}
          onChange={(e) => setFoamUnit(e.target.value)}
          style={inputStyle}
        >
          <option value="">בחר יחידה</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </Field>

      {/* כמות – שדה מספרי */}
      <Field label="כמות">
        <input
          type="number" step="0.01" min="0.01"
          value={foamAmount}
          onChange={(e) => setFoamAmount(e.target.value)}
          placeholder="250"
          style={inputStyle}
        />
      </Field>
    </div>
  );
}
