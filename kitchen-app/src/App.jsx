// ============================================================
//  src/App.jsx
//  קומפוננטה ראשית – מנהלת את כל האפליקציה:
//
//  ניתוב (ללא react-router, מבוסס state):
//    • home   – רשימת מתכונים + סינון
//    • detail – פרטי מתכון בודד
//    • add    – אשף הוספת מתכון חדש
//
//  טעינת נתונים:
//    בטעינה ראשונית מביא מהשרת:
//    – מתכונים (MongoDB)
//    – רכיבים, יחידות, סוגי קצף (SQLite)
//
//  אימות:
//    כניסה באמצעות סיסמה → session cookie → גישה להוספה
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_API } from './utils/constants';
import { login, fetchRecipes, fetchIngredients, fetchUnits, fetchFoamTypes } from './utils/api';
import { getIngName, getUnitName, getFoamName } from './utils/lookups';

// קומפוננטות
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import FilterBar from './components/FilterBar';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';
import RecipeWizard from './components/RecipeWizard';

export default function App() {
  // ─── כתובת שרת ───
  const [apiUrl, setApiUrl] = useState(DEFAULT_API);

  // ─── ניתוב פנימי ───
  const [page, setPage] = useState('home');         // home | detail | add
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // ─── אימות ───
  const [isAuth, setIsAuth] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // ─── נתונים מהשרת ───
  const [ingredients, setIngredients] = useState([]); // רכיבים (SQLite)
  const [units, setUnits] = useState([]);             // יחידות (SQLite)
  const [foamTypes, setFoamTypes] = useState([]);     // סוגי קצף (SQLite)
  const [recipes, setRecipes] = useState([]);         // מתכונים (MongoDB)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── סינון ───
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  // ════════════════════════════════════════════════════
  //  טעינת כל הנתונים מהשרת
  // ════════════════════════════════════════════════════
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // קריאה מקבילה ל-4 endpoints
      const [ing, un, ft, rec] = await Promise.all([
        fetchIngredients(apiUrl),
        fetchUnits(apiUrl),
        fetchFoamTypes(apiUrl),
        fetchRecipes(apiUrl),
      ]);
      setIngredients(ing);
      setUnits(un);
      setFoamTypes(ft);
      setRecipes(rec);
    } catch (e) {
      setError(`שגיאה בטעינת נתונים: ${e.message}`);
    }
    setLoading(false);
  }, [apiUrl]);

  // טעינה ראשונית + טעינה מחדש בעת שינוי כתובת שרת
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ════════════════════════════════════════════════════
  //  אימות סיסמה
  // ════════════════════════════════════════════════════
  const handleLogin = async (password) => {
    try {
      await login(apiUrl, password);
      setIsAuth(true);
      setShowLogin(false);
      return true;
    } catch {
      return false;
    }
  };

  // ════════════════════════════════════════════════════
  //  ניווט
  // ════════════════════════════════════════════════════
  const openDetail = (recipe) => {
    setSelectedRecipe(recipe);
    setPage('detail');
  };

  const openAdd = () => {
    // דורש אימות – אם לא מחובר, פותח חלון התחברות
    if (!isAuth) {
      setShowLogin(true);
      return;
    }
    setPage('add');
  };

  const handleRecipeCreated = () => {
    loadData();       // רענון רשימת המתכונים
    setPage('home');  // חזרה לדף הבית
  };

  // ════════════════════════════════════════════════════
  //  סינון מתכונים
  // ════════════════════════════════════════════════════
  const filtered = recipes.filter((r) => {
    // חיפוש לפי שם עברי או אנגלי
    if (search && !r.name.includes(search) && !r.nameEn.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // סינון לפי קטגוריה
    if (catFilter && r.category !== catFilter) return false;
    // סינון לפי רמת קושי (מציג עד הרמה שנבחרה)
    if (diffFilter && r.difficulty > Number(diffFilter)) return false;
    return true;
  });

  // ════════════════════════════════════════════════════
  //  רינדור
  // ════════════════════════════════════════════════════
  return (
    <div dir="rtl" style={{
      fontFamily: "'Heebo', 'Segoe UI', sans-serif",
      background: '#FAF8F5',
      minHeight: '100vh',
      color: '#1A1A2E',
    }}>
      {/* ─── כותרת עליונה ─── */}
      <Header
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        isAuth={isAuth}
        onLoginClick={() => setShowLogin(true)}
        onAddClick={openAdd}
        onLogoClick={() => setPage('home')}
        onRefresh={loadData}
      />

      {/* ─── חלון התחברות ─── */}
      {showLogin && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* ─── תוכן עיקרי ─── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* הודעת שגיאה */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            color: '#991B1B', fontSize: 14,
          }}>
            ⚠️ {error}
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>
              וודא שהשרת פועל בכתובת {apiUrl} ולחץ על ⚙️ לשינוי
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────── */}
        {/*  דף הבית – רשימת מתכונים               */}
        {/* ──────────────────────────────────────── */}
        {page === 'home' && (
          <>
            {/* פס סינון */}
            <FilterBar
              search={search}       setSearch={setSearch}
              catFilter={catFilter} setCatFilter={setCatFilter}
              diffFilter={diffFilter} setDiffFilter={setDiffFilter}
              resultCount={filtered.length}
            />

            {/* תצוגת מתכונים */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div>טוען מתכונים...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div>לא נמצאו מתכונים</div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 18,
              }}>
                {filtered.map((r) => (
                  <RecipeCard
                    key={r._id}
                    recipe={r}
                    onClick={() => openDetail(r)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ──────────────────────────────────────── */}
        {/*  פרטי מתכון                             */}
        {/* ──────────────────────────────────────── */}
        {page === 'detail' && selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            getIngName={(id) => getIngName(ingredients, id)}
            getUnitName={(id) => getUnitName(units, id)}
            getFoamName={(id) => getFoamName(foamTypes, id)}
            onBack={() => setPage('home')}
          />
        )}

        {/* ──────────────────────────────────────── */}
        {/*  הוספת מתכון חדש                        */}
        {/* ──────────────────────────────────────── */}
        {page === 'add' && (
          <RecipeWizard
            apiUrl={apiUrl}
            ingredients={ingredients}
            units={units}
            foamTypes={foamTypes}
            recipes={recipes}
            onDone={handleRecipeCreated}
            onCancel={() => setPage('home')}
          />
        )}
      </main>
    </div>
  );
}
