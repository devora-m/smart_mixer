// ============================================================
//  src/components/StepEditor.jsx
//  עורך שלב חדש – תהליך מודרך:
//  1. בחירת סוג שלב (ADD / MIX / WHIP / וכו')
//  2. מילוי השדות הרלוונטיים לסוג שנבחר
//  3. לחיצה על "הוסף שלב" → מחזיר אובייקט שלב תקין
//
//  הסדר בשלב MIX_ADD מתאים בדיוק לסכמת MongoDB:
//    מהירות → רכיבים → זמן נוסף
// ============================================================
import React, { useState } from 'react';
import { STEP_TYPES, STEP_COLORS } from '../utils/constants';
import { inputStyle, btnPrimary, btnSecondary } from '../utils/styles';
import Field from './Field';
import IngredientPicker from './IngredientPicker';
import WhipFields from './WhipFields';

export default function StepEditor({
  ingredients,  // רכיבים מ-SQLite
  units,        // יחידות מ-SQLite
  foamTypes,    // סוגי קצף מ-SQLite
  onAdd,        // callback – מוסיף שלב למערך
  onCancel,     // callback – ביטול
}) {
  // ─── מצב הטופס ───
  const [type, setType] = useState('');          // סוג שלב נבחר

  // רכיבים (ADD / MIX_ADD / WHIP_ADD)
  const [ingList, setIngList] = useState([]);    // רכיבים שנבחרו
  const [curIng, setCurIng] = useState('');       // רכיב נוכחי ב-dropdown
  const [curUnit, setCurUnit] = useState('');     // יחידה נוכחית ב-dropdown
  const [curAmount, setCurAmount] = useState(''); // כמות נוכחית

  // ערבוב (MIX / MIX_ADD / WHIP / WHIP_ADD)
  const [motorSpeed, setMotorSpeed] = useState('5');
  const [duration, setDuration] = useState('');

  // הקצפה (WHIP / WHIP_ADD)
  const [foamType, setFoamType] = useState('');
  const [foamIng, setFoamIng] = useState('');
  const [foamUnit, setFoamUnit] = useState('');
  const [foamAmount, setFoamAmount] = useState('');

  // הוראה (INSTRUCTION)
  const [instrText, setInstrText] = useState('');

  // ─── הוספת רכיב לרשימה ───
  const addIngredient = () => {
    if (!curIng || !curUnit || !curAmount) return;
    setIngList([...ingList, {
      ingredientId: Number(curIng),
      unitId: Number(curUnit),
      amount: Number(curAmount),
    }]);
    // איפוס השדות לבחירת רכיב הבא
    setCurIng('');
    setCurUnit('');
    setCurAmount('');
  };

  // הסרת רכיב מהרשימה
  const removeIngredient = (idx) => {
    setIngList(ingList.filter((_, i) => i !== idx));
  };

  // פונקציות עזר לתצוגת שמות
  const getIngName = (id) => ingredients.find((i) => i.id === id)?.name || `#${id}`;
  const getUnitName = (id) => units.find((u) => u.id === id)?.name || `#${id}`;

  // ─── בדיקה האם הטופס מלא ותקין ───
  const canSubmit = () => {
    switch (type) {
      case 'ADD':         return ingList.length > 0;
      case 'MIX':         return motorSpeed && duration && Number(duration) > 0;
      case 'MIX_ADD':     return motorSpeed && ingList.length > 0;
      case 'WHIP':        return motorSpeed && foamType && foamIng && foamUnit && foamAmount;
      case 'WHIP_ADD':    return motorSpeed && foamType && foamIng && foamUnit && foamAmount && ingList.length > 0;
      case 'INSTRUCTION': return instrText.trim().length > 0 && instrText.length <= 63;
      case 'FINISH':      return true;
      default:            return false;
    }
  };

  // ─── בניית אובייקט שלב ושליחה ───
  const submit = () => {
    const step = { type };

    switch (type) {
      case 'ADD':
        step.ingredients = ingList;
        break;

      case 'MIX':
        step.motorSpeed = Number(motorSpeed);
        step.durationSec = Number(duration);
        break;

      case 'MIX_ADD':
        // סדר לפי הסכמה: מהירות → רכיבים → זמן נוסף
        step.motorSpeed = Number(motorSpeed);
        step.ingredients = ingList;
        step.durationSec = Number(duration) || 0;
        break;

      case 'WHIP':
        step.motorSpeed = Number(motorSpeed);
        step.foamTypeId = Number(foamType);
        step.foamIngredientId = Number(foamIng);
        step.foamUnitId = Number(foamUnit);
        step.foamAmount = Number(foamAmount);
        break;

      case 'WHIP_ADD':
        // סדר לפי הסכמה: מהירות → קצף → רכיבים → זמן נוסף
        step.motorSpeed = Number(motorSpeed);
        step.foamTypeId = Number(foamType);
        step.foamIngredientId = Number(foamIng);
        step.foamUnitId = Number(foamUnit);
        step.foamAmount = Number(foamAmount);
        step.ingredients = ingList;
        step.durationSec = Number(duration) || 0;
        break;

      case 'INSTRUCTION':
        step.instructionText = instrText.trim();
        step.recordingId = null;  // אודיו לא מיושם עדיין
        break;

      case 'FINISH':
        // אין שדות נוספים
        break;
    }

    onAdd(step);
  };

  // ─── איפוס הטופס בעת שינוי סוג ───
  const resetAndChangeType = (newType) => {
    setType(newType);
    setIngList([]);
    setCurIng(''); setCurUnit(''); setCurAmount('');
    setMotorSpeed('5'); setDuration('');
    setFoamType(''); setFoamIng(''); setFoamUnit(''); setFoamAmount('');
    setInstrText('');
  };

  return (
    <div style={{
      marginTop: 10, padding: 20, borderRadius: 12,
      border: '2px solid #C4883A', background: '#FFFBF5',
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>
        הוספת שלב חדש
      </h3>

      {/* ════════════════════════════════════════════════ */}
      {/*  שלב 1: בחירת סוג שלב (אם עדיין לא נבחר)     */}
      {/* ════════════════════════════════════════════════ */}
      {!type ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 8,
        }}>
          {STEP_TYPES.map((st) => (
            <button
              key={st.val}
              onClick={() => resetAndChangeType(st.val)}
              style={{
                padding: '14px 12px', borderRadius: 10,
                border: '1px solid #E5E7EB', background: '#fff',
                cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{st.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{st.label}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{st.desc}</div>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* ─── תווית סוג השלב הנבחר + כפתור שינוי ─── */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 16,
            background: STEP_COLORS[type] + '18',
            padding: '6px 14px', borderRadius: 8,
            fontSize: 14, fontWeight: 600,
          }}>
            {STEP_TYPES.find((t) => t.val === type)?.icon}
            {STEP_TYPES.find((t) => t.val === type)?.label}
            <button onClick={() => resetAndChangeType('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: '#9CA3AF', marginRight: 4,
            }}>✕</button>
          </div>

          {/* ════════════════════════════════════════════ */}
          {/*  שלב 2: שדות מותאמים לסוג הנבחר            */}
          {/* ════════════════════════════════════════════ */}

          {/* ── ADD: בחירת רכיבים בלבד ── */}
          {type === 'ADD' && (
            <IngredientPicker
              ingredients={ingredients} units={units}
              ingList={ingList} addIngredient={addIngredient}
              removeIngredient={removeIngredient}
              curIng={curIng} setCurIng={setCurIng}
              curUnit={curUnit} setCurUnit={setCurUnit}
              curAmount={curAmount} setCurAmount={setCurAmount}
              getIngName={getIngName} getUnitName={getUnitName}
            />
          )}

          {/* ── MIX: מהירות + זמן ── */}
          {type === 'MIX' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="מהירות מנוע (1-10)">
                <input type="range" min="1" max="10" value={motorSpeed}
                  onChange={(e) => setMotorSpeed(e.target.value)}
                  style={{ width: '100%' }} />
                <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, color: '#3b82f6' }}>
                  {motorSpeed}
                </div>
              </Field>
              <Field label="משך זמן (שניות)">
                <input type="number" min="1" value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="120" style={inputStyle} />
              </Field>
            </div>
          )}

          {/* ── MIX_ADD: מהירות → רכיבים → זמן נוסף ── */}
          {type === 'MIX_ADD' && (
            <>
              {/* 1. מהירות */}
              <Field label="מהירות מנוע (1-10)">
                <input type="range" min="1" max="10" value={motorSpeed}
                  onChange={(e) => setMotorSpeed(e.target.value)}
                  style={{ width: '100%' }} />
                <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, color: '#6366f1' }}>
                  {motorSpeed}
                </div>
              </Field>

              {/* 2. רכיבים */}
              <div style={{ marginTop: 12 }}>
                <IngredientPicker
                  ingredients={ingredients} units={units}
                  ingList={ingList} addIngredient={addIngredient}
                  removeIngredient={removeIngredient}
                  curIng={curIng} setCurIng={setCurIng}
                  curUnit={curUnit} setCurUnit={setCurUnit}
                  curAmount={curAmount} setCurAmount={setCurAmount}
                  getIngName={getIngName} getUnitName={getUnitName}
                />
              </div>

              {/* 3. זמן ערבוב נוסף אחרי הרכיב האחרון */}
              <Field label="זמן ערבוב נוסף אחרי הרכיב האחרון (שניות)" style={{ marginTop: 12 }}>
                <input type="number" min="0" value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0 (ברירת מחדל)" style={inputStyle} />
              </Field>
            </>
          )}

          {/* ── WHIP: הקצפה בלבד ── */}
          {type === 'WHIP' && (
            <WhipFields
              foamTypes={foamTypes} ingredients={ingredients} units={units}
              motorSpeed={motorSpeed} setMotorSpeed={setMotorSpeed}
              foamType={foamType} setFoamType={setFoamType}
              foamIng={foamIng} setFoamIng={setFoamIng}
              foamUnit={foamUnit} setFoamUnit={setFoamUnit}
              foamAmount={foamAmount} setFoamAmount={setFoamAmount}
              color="#f59e0b"
            />
          )}

          {/* ── WHIP_ADD: הקצפה → רכיבים → זמן נוסף ── */}
          {type === 'WHIP_ADD' && (
            <>
              {/* 1. שדות הקצפה */}
              <WhipFields
                foamTypes={foamTypes} ingredients={ingredients} units={units}
                motorSpeed={motorSpeed} setMotorSpeed={setMotorSpeed}
                foamType={foamType} setFoamType={setFoamType}
                foamIng={foamIng} setFoamIng={setFoamIng}
                foamUnit={foamUnit} setFoamUnit={setFoamUnit}
                foamAmount={foamAmount} setFoamAmount={setFoamAmount}
                color="#f97316"
              />

              {/* 2. רכיבים להוספה אחרי ההקצפה */}
              <h4 style={{ marginTop: 16, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                רכיבים להוספה אחרי ההקצפה:
              </h4>
              <IngredientPicker
                ingredients={ingredients} units={units}
                ingList={ingList} addIngredient={addIngredient}
                removeIngredient={removeIngredient}
                curIng={curIng} setCurIng={setCurIng}
                curUnit={curUnit} setCurUnit={setCurUnit}
                curAmount={curAmount} setCurAmount={setCurAmount}
                getIngName={getIngName} getUnitName={getUnitName}
              />

              {/* 3. זמן ערבוב נוסף */}
              <Field label="זמן ערבוב נוסף אחרי הרכיב האחרון (שניות)" style={{ marginTop: 12 }}>
                <input type="number" min="0" value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="0 (ברירת מחדל)" style={inputStyle} />
              </Field>
            </>
          )}

          {/* ── INSTRUCTION: הוראה טקסטואלית ── */}
          {type === 'INSTRUCTION' && (
            <Field label={`הוראה (עד 63 תווים) — נוכחי: ${instrText.length}/63`}>
              <input
                value={instrText}
                onChange={(e) => e.target.value.length <= 63 && setInstrText(e.target.value)}
                placeholder="לדוגמה: Put mixture in fridge for 10 minutes"
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              />
              {/* אזהרה כשמתקרבים למגבלה */}
              {instrText.length > 50 && (
                <div style={{
                  fontSize: 11, marginTop: 4,
                  color: instrText.length > 63 ? '#EF4444' : '#F59E0B',
                }}>
                  {63 - instrText.length} תווים נותרו
                </div>
              )}
            </Field>
          )}

          {/* ── FINISH: אין שדות ── */}
          {type === 'FINISH' && (
            <div style={{ color: '#6B7280', fontSize: 14, padding: '8px 0' }}>
              שלב סיום – לא נדרשים שדות נוספים
            </div>
          )}

          {/* ─── כפתורי פעולה ─── */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button
              onClick={submit}
              disabled={!canSubmit()}
              style={{
                ...btnPrimary,
                opacity: canSubmit() ? 1 : 0.5,
                cursor: canSubmit() ? 'pointer' : 'not-allowed',
              }}
            >✓ הוסף שלב</button>
            <button onClick={onCancel} style={btnSecondary}>ביטול</button>
          </div>
        </>
      )}
    </div>
  );
}
