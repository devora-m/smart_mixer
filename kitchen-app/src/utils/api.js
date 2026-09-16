// ============================================================
//  src/utils/api.js
//  פונקציות עזר לתקשורת עם שרת ה-Node.js
//  כל הקריאות משתמשות ב-credentials: include כדי לשלוח cookies
// ============================================================

/**
 * קריאה גנרית לשרת.
 * @param {string} base   – כתובת בסיס, לדוגמה http://localhost:4000
 * @param {string} path   – נתיב, לדוגמה /api/recipes
 * @param {object} opts   – אפשרויות fetch נוספות (method, body, headers)
 * @returns {Promise<any>} – התגובה כ-JSON
 * @throws {Error}         – אם השרת מחזיר שגיאה
 */
export async function apiFetch(base, path, opts = {}) {
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',       // שליחת session cookie
    headers: {
      'Content-Type': 'application/json',
      ...opts.headers,
    },
    ...opts,
  });

  // ניסיון לפרסר JSON; אם נכשל – אובייקט ריק
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `שגיאת שרת: ${res.status}`);
  }
  return data;
}

// ============================================================
//  פונקציות ספציפיות לכל endpoint
// ============================================================

/** אימות סיסמה – POST /api/auth/verify */
export const login = (base, password) =>
  apiFetch(base, '/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

/** טעינת כל המתכונים – GET /api/recipes */
export const fetchRecipes = (base) =>
  apiFetch(base, '/api/recipes');

/** טעינת כל הרכיבים מ-SQLite – GET /api/ingredients */
export const fetchIngredients = (base) =>
  apiFetch(base, '/api/ingredients');

/** טעינת כל היחידות מ-SQLite – GET /api/units */
export const fetchUnits = (base) =>
  apiFetch(base, '/api/units');

/** טעינת סוגי קצף מ-SQLite – GET /api/foam-types */
export const fetchFoamTypes = (base) =>
  apiFetch(base, '/api/foam-types');

/** יצירת מתכון חדש – POST /api/recipes (דורש אימות) */
export const createRecipe = (base, recipe) =>
  apiFetch(base, '/api/recipes', {
    method: 'POST',
    body: JSON.stringify(recipe),
  });
