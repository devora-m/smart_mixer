// ============================================================
//  src/utils/lookups.js
//  פונקציות חיפוש – מתרגמות מזהה מספרי (SQLite) לשם תצוגה
// ============================================================

/**
 * מחזיר את שם הרכיב לפי מזהה.
 * אם לא נמצא – מציג #ID כברירת מחדל.
 */
export const getIngName = (ingredients, id) =>
  ingredients.find((i) => i.id === id)?.name || `#${id}`;

/**
 * מחזיר את שם יחידת המידה לפי מזהה.
 */
export const getUnitName = (units, id) =>
  units.find((u) => u.id === id)?.name || `#${id}`;

/**
 * מחזיר את שם סוג הקצף לפי מזהה.
 */
export const getFoamName = (foamTypes, id) =>
  foamTypes.find((f) => f.id === id)?.name || `#${id}`;
