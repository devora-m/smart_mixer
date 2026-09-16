// ============================================================
//  src/components/Header.jsx
//  כותרת עליונה קבועה (sticky) – כוללת:
//  • לוגו ושם המערכת
//  • כפתור התחברות / כפתור הוספת מתכון (אם מחובר)
//  • הגדרות כתובת שרת (נפתח בלחיצה על הגדרות)
// ============================================================
import React, { useState } from 'react';

export default function Header({
  apiUrl,         // כתובת השרת הנוכחית
  setApiUrl,      // עדכון כתובת השרת
  isAuth,         // האם המשתמש מאומת
  onLoginClick,   // פתיחת חלון התחברות
  onAddClick,     // מעבר למסך הוספת מתכון
  onLogoClick,    // חזרה לדף הבית
  onRefresh,      // רענון נתונים מהשרת
}) {
  // מצב פתיחת פאנל הגדרות שרת
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header style={{
      background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
      color: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      {/* ─── שורה עליונה: לוגו + כפתורים ─── */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* לוגו + שם – לחיצה חוזרת לדף הבית */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={onLogoClick}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: '#C4883A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🍰</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.5px' }}>
              צעד בטוח במטבח
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 300 }}>
              מערכת ניהול מתכונים למיקסר חכם
            </div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* אם מאומת – כפתור הוספת מתכון */}
          {isAuth && (
            <button onClick={onAddClick} style={{
              background: '#C4883A', border: 'none', color: '#fff',
              padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
            }}>
              + מתכון חדש
            </button>
          )}

          {/* אם לא מאומת – כפתור התחברות */}
          {!isAuth && (
            <button onClick={onLoginClick} style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', padding: '8px 18px', borderRadius: 8,
              cursor: 'pointer', fontWeight: 500, fontSize: 14, fontFamily: 'inherit',
            }}>
              🔑 כניסה
            </button>
          )}

          {/* כפתור הגדרות – פותח/סוגר פאנל כתובת שרת */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none', border: 'none', color: '#fff',
              cursor: 'pointer', fontSize: 20, padding: 4, opacity: 0.7,
            }}
          >⚙️</button>
        </div>
      </div>

      {/* ─── פאנל הגדרות שרת (נסתר כברירת מחדל) ─── */}
      {showSettings && (
        <div style={{
          background: '#1a2634',
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <label style={{ fontSize: 13, opacity: 0.8 }}>כתובת שרת:</label>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              style={{
                flex: 1, maxWidth: 400, padding: '6px 12px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 14, fontFamily: 'monospace',
                direction: 'ltr',
              }}
              placeholder="http://localhost:4000"
            />
            <button onClick={onRefresh} style={{
              background: '#C4883A', border: 'none', color: '#fff',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, fontFamily: 'inherit',
            }}>רענן</button>
          </div>
        </div>
      )}
    </header>
  );
}
