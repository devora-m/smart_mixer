// ============================================================
//  src/components/LoginModal.jsx
//  חלון התחברות (modal) – מציג שדה סיסמה ושולח לשרת.
//  לאחר אימות מוצלח, נוצר session cookie בצד השרת
//  שמאפשר גישה ליצירת מתכונים.
// ============================================================
import React, { useState } from 'react';

export default function LoginModal({ onLogin, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // שליחת הסיסמה לאימות
  const submit = async () => {
    setLoading(true);
    setError(false);
    const success = await onLogin(password);
    setLoading(false);
    if (!success) setError(true);
  };

  return (
    // רקע כהה – לחיצה עליו סוגרת את החלון
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      {/* תוכן החלון – מניעת סגירה בלחיצה פנימית */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: 32,
          maxWidth: 380, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>
          🔑 כניסה למערכת
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280' }}>
          הזן סיסמה כדי להוסיף ולערוך מתכונים
        </p>

        {/* שדה סיסמה */}
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="סיסמה"
          autoFocus
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 8,
            border: `1px solid ${error ? '#EF4444' : '#E5E7EB'}`,
            fontSize: 16, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', marginBottom: 12,
          }}
        />

        {/* הודעת שגיאה */}
        {error && (
          <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 10 }}>
            סיסמה שגויה
          </div>
        )}

        {/* כפתורי פעולה */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={submit}
            disabled={loading || !password}
            style={{
              flex: 1, padding: '11px', borderRadius: 8, border: 'none',
              background: '#C4883A', color: '#fff', fontSize: 15,
              fontWeight: 600, fontFamily: 'inherit',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.6 : 1,
            }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '11px 20px', borderRadius: 8,
              border: '1px solid #E5E7EB', background: '#fff',
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              color: '#6B7280',
            }}
          >ביטול</button>
        </div>
      </div>
    </div>
  );
}
