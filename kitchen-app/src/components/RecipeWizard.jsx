//  src/components/RecipeWizard.jsx
//  אשף הוספת מתכון חדש – 3 שלבים:
//
//  שלב 1 (info)   – פרטי המתכון: שם, קטגוריה, קושי וכו'
//  שלב 2 (steps)  – בניית שלבי הכנה (ADD/MIX/WHIP/...)
//  שלב 3 (review) – סקירה סופית ושמירה לשרת
//
//  קוד המתכון נקבע אוטומטית:
//    הקוד הגבוה ביותר הקיים + 1 (ספרה בודדת)
import React, { useState } from 'react';
import { CATEGORIES, DIFFICULTIES, STEP_TYPES, STEP_COLORS } from '../utils/constants';
import { createRecipe } from '../utils/api';
import { getIngName, getUnitName, getFoamName } from '../utils/lookups';
import { inputStyle, btnPrimary, btnSecondary, smallBtn } from '../utils/styles';
import Field from './Field';
import StepEditor from './StepEditor';
import StepDisplay from './StepDisplay';

export default function RecipeWizard({
  apiUrl,       // כתובת השרת
  ingredients,  // רכיבים מ-SQLite
  units,        // יחידות מ-SQLite
  foamTypes,    // סוגי קצף מ-SQLite
  recipes,      // כל המתכונים – לחישוב הקוד הבא
  onDone,       // callback – חזרה לרשימה אחרי שמירה מוצלחת
  onCancel,     // callback – ביטול
}) {
  // ─── ניהול שלבי האשף ───
  const [phase, setPhase] = useState('info'); // info | steps | review
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  // ─── שדות פרטי המתכון ───
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');

  // ─── שלבי הכנה ───
  const [steps, setSteps] = useState([]);
  const [editingStep, setEditingStep] = useState(null); // null = לא עורכים | 'new' = עורך פתוח

  // קוד אוטומטי – הגבוה ביותר + 1
  const nextCode = Math.max(0, ...recipes.map((r) => r.code)) + 1;

  // בדיקה שכל שדות החובה מלאים
  const infoValid = name && nameEn && category && difficulty && prepTime && servings;

  // ─── ניהול שלבים ───
  const addStep = (step) => {
    setSteps([...steps, step]);
    setEditingStep(null);
  };

  const removeStep = (idx) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  // הזזת שלב למעלה/למטה
  const moveStep = (idx, dir) => {
    const arr = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSteps(arr);
  };

  // ─── שמירה לשרת ───
  const handleSave = async () => {
    setSaving(true);
    setSaveErr('');

    // בניית אובייקט המתכון – בדיוק לפי סכמת MongoDB
    const recipe = {
      name,
      nameEn,
      category,
      difficulty: Number(difficulty),
      prepTimeMin: Number(prepTime),
      baseServings: Number(servings),
      code: nextCode,
      finishRecordingId: null,
      steps,
    };

    try {
      await createRecipe(apiUrl, recipe);
      onDone(); // חזרה לרשימה + רענון
    } catch (e) {
      setSaveErr(e.message);
    }
    setSaving(false);
  };

  // פונקציות lookup מקוצרות
  const ing = (id) => getIngName(ingredients, id);
  const unit = (id) => getUnitName(units, id);
  const foam = (id) => getFoamName(foamTypes, id);

  // ─── הגדרת שלבי ההתקדמות ───
  const phases = [
    { id: 'info',   label: 'פרטי המתכון', num: '1' },
    { id: 'steps',  label: 'שלבי הכנה',   num: '2' },
    { id: 'review', label: 'סקירה ושמירה', num: '3' },
  ];

  return (
    <div>
      {/* כפתור חזרה */}
      <button onClick={onCancel} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 14, color: '#C4883A', fontWeight: 600,
        marginBottom: 16, padding: 0, fontFamily: 'inherit',
      }}>→ ביטול וחזרה</button>

      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden',
      }}>
        {/* ════════════════════════════════════════════════ */}
        {/*  סרגל התקדמות – 3 שלבים                        */}
        {/* ════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6' }}>
          {phases.map((p) => (
            <div key={p.id} style={{
              flex: 1, padding: '14px 16px', textAlign: 'center',
              background: phase === p.id ? '#C4883A' : 'transparent',
              color: phase === p.id ? '#fff' : '#9CA3AF',
              fontWeight: phase === p.id ? 700 : 400,
              fontSize: 14, transition: 'all 0.2s',
            }}>
              <span style={{
                display: 'inline-flex', width: 24, height: 24,
                borderRadius: '50%', alignItems: 'center', justifyContent: 'center',
                background: phase === p.id ? 'rgba(255,255,255,0.3)' : '#F3F4F6',
                marginLeft: 6, fontSize: 12, fontWeight: 700,
              }}>{p.num}</span>
              {p.label}
            </div>
          ))}
        </div>

        <div style={{ padding: '28px 30px' }}>
          {/* ════════════════════════════════════════════ */}
          {/*  שלב 1: פרטי המתכון                        */}
          {/* ════════════════════════════════════════════ */}
          {phase === 'info' && (
            <>
              <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>
                פרטי המתכון
                <span style={{ fontSize: 14, fontWeight: 400, color: '#C4883A', marginRight: 10 }}>
                  קוד: #{nextCode}
                </span>
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="שם המתכון (עברית)" required>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="לדוגמה: עוגת שוקולד" style={inputStyle} />
                </Field>
                <Field label="שם באנגלית" required>
                  <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Chocolate Cake"
                    style={{ ...inputStyle, direction: 'ltr' }} />
                </Field>
                <Field label="קטגוריה" required>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                    <option value="">בחר קטגוריה</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="רמת קושי" required>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={inputStyle}>
                    <option value="">בחר רמה</option>
                    {DIFFICULTIES.map((d) => (
                      <option key={d.val} value={d.val}>{d.emoji} {d.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="זמן הכנה (דקות)" required>
                  <input type="number" min="1" value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="20" style={inputStyle} />
                </Field>
                <Field label="מספר מנות" required>
                  <input type="number" min="1" value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="6" style={inputStyle} />
                </Field>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  disabled={!infoValid}
                  onClick={() => setPhase('steps')}
                  style={{
                    ...btnPrimary,
                    opacity: infoValid ? 1 : 0.5,
                    cursor: infoValid ? 'pointer' : 'not-allowed',
                  }}
                >המשך לשלבים ←</button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════ */}
          {/*  שלב 2: שלבי הכנה                          */}
          {/* ════════════════════════════════════════════ */}
          {phase === 'steps' && (
            <>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 20,
              }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>שלבי הכנה</h2>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>{steps.length} שלבים</div>
              </div>

              {/* רשימת השלבים הקיימים */}
              {steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 10, padding: '12px 14px', borderRadius: 10,
                  background: '#FAFAFA', border: '1px solid #F3F4F6',
                }}>
                  {/* עיגול צבעוני */}
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: STEP_COLORS[step.type], color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</span>

                  {/* תיאור מקוצר */}
                  <div style={{ flex: 1, fontSize: 14 }}>
                    <strong>
                      {STEP_TYPES.find((t) => t.val === step.type)?.icon}{' '}
                      {STEP_TYPES.find((t) => t.val === step.type)?.label}
                    </strong>
                    {step.type === 'ADD' && (
                      <span style={{ color: '#6B7280', marginRight: 8 }}>
                        ({step.ingredients.map((i) => ing(i.ingredientId)).join(', ')})
                      </span>
                    )}
                    {step.type === 'MIX' && (
                      <span style={{ color: '#6B7280', marginRight: 8 }}>
                        (מהירות {step.motorSpeed}, {step.durationSec} שניות)
                      </span>
                    )}
                    {step.type === 'MIX_ADD' && (
                      <span style={{ color: '#6B7280', marginRight: 8 }}>
                        (מהירות {step.motorSpeed}, {step.ingredients.map((i) => ing(i.ingredientId)).join(', ')}, זמן נוסף: {step.durationSec || 0}ש')
                      </span>
                    )}
                    {step.type === 'WHIP' && (
                      <span style={{ color: '#6B7280', marginRight: 8 }}>
                        ({foam(step.foamTypeId)}, מהירות {step.motorSpeed})
                      </span>
                    )}
                    {step.type === 'WHIP_ADD' && (
                      <span style={{ color: '#6B7280', marginRight: 8 }}>
                        ({foam(step.foamTypeId)}, {step.ingredients.map((i) => ing(i.ingredientId)).join(', ')})
                      </span>
                    )}
                    {step.type === 'INSTRUCTION' && (
                      <span style={{ color: '#6B7280', marginRight: 8 }}>
                        ({step.instructionText})
                      </span>
                    )}
                  </div>

                  {/* כפתורי הזזה ומחיקה */}
                  <button onClick={() => moveStep(i, -1)} disabled={i === 0}
                    style={smallBtn}>▲</button>
                  <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                    style={smallBtn}>▼</button>
                  <button onClick={() => removeStep(i)}
                    style={{ ...smallBtn, color: '#EF4444' }}>✕</button>
                </div>
              ))}

              {/* עורך שלב חדש / כפתור הוספה */}
              {editingStep === null ? (
                <button onClick={() => setEditingStep('new')} style={{
                  width: '100%', padding: 14, borderRadius: 10,
                  border: '2px dashed #D1D5DB', background: 'transparent',
                  cursor: 'pointer', fontSize: 15, fontFamily: 'inherit',
                  color: '#6B7280', marginTop: 6,
                }}>
                  + הוסף שלב חדש
                </button>
              ) : (
                <StepEditor
                  ingredients={ingredients}
                  units={units}
                  foamTypes={foamTypes}
                  onAdd={addStep}
                  onCancel={() => setEditingStep(null)}
                />
              )}

              {/* ניווט בין שלבי האשף */}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setPhase('info')} style={btnSecondary}>
                  ← חזרה לפרטים
                </button>
                <button
                  disabled={steps.length === 0}
                  onClick={() => setPhase('review')}
                  style={{
                    ...btnPrimary,
                    opacity: steps.length > 0 ? 1 : 0.5,
                    cursor: steps.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >סקירה ושמירה ←</button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════ */}
          {/*  שלב 3: סקירה ושמירה                       */}
          {/* ════════════════════════════════════════════ */}
          {phase === 'review' && (
            <>
              <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>
                סקירה לפני שמירה
              </h2>

              {/* סיכום פרטים */}
              <div style={{
                background: '#F9FAFB', borderRadius: 12,
                padding: '18px 22px', marginBottom: 20,
                border: '1px solid #F3F4F6',
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '8px 24px', fontSize: 14,
                }}>
                  <div><strong>שם:</strong> {name}</div>
                  <div><strong>שם באנגלית:</strong> {nameEn}</div>
                  <div><strong>קטגוריה:</strong> {category}</div>
                  <div><strong>רמת קושי:</strong> {DIFFICULTIES.find((d) => d.val === Number(difficulty))?.label}</div>
                  <div><strong>זמן הכנה:</strong> {prepTime} דקות</div>
                  <div><strong>מנות:</strong> {servings}</div>
                  <div><strong>קוד:</strong> #{nextCode}</div>
                </div>
              </div>

              {/* סיכום שלבים */}
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                שלבים ({steps.length})
              </h3>
              {steps.map((step, i) => (
                <StepDisplay
                  key={i} step={step} index={i}
                  getIngName={(id) => ing(id)}
                  getUnitName={(id) => unit(id)}
                  getFoamName={(id) => foam(id)}
                />
              ))}

              {/* הודעת שגיאה */}
              {saveErr && (
                <div style={{
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 10, padding: '12px 16px', marginTop: 16,
                  color: '#991B1B', fontSize: 14,
                }}>⚠️ {saveErr}</div>
              )}

              {/* ניווט */}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setPhase('steps')} style={btnSecondary}>
                  ← חזרה לשלבים
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    ...btnPrimary,
                    background: '#059669',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'שומר...' : '✓ שמור מתכון'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
