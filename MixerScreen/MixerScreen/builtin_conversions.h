#pragma once
#include <Arduino.h>

// =====================================================
//  טבלת שברי כמויות (amount → folder 03, record)
//  לפי סדר עולה — נשתמש בזה לפיצול כמויות
// =====================================================
struct AmountEntry {
    float   value;
    int     folder;   // תמיד 3
    int     record;
};

// מסודר מגדול לקטן כדי שהחיפוש יעבוד נכון (greedy)
// מספרי record = מספרי קבצים בתיקייה 03 על ה-SD
static const AmountEntry AMOUNT_TABLE[] = {
    { 250.0f, 3,  3 },  // 03/003 = מאתיים וחמישים ✓
    { 200.0f, 3, 19 },  // 03/019 = מאתיים              — אין הקלטה עדיין
    { 125.0f, 3, 22 },  // 03/022 = מאה עשרים וחמש — אין הקלטה עדיין
    { 100.0f, 3,  2 },  // 03/002 = מאה ✓
    {  10.0f, 3, 18 },  // אין הקלטה עדיין
    {   9.0f, 3, 17 },
    {   8.0f, 3, 16 },
    {   7.0f, 3, 15 },
    {   6.0f, 3, 14 },
    {   5.0f, 3, 13 },
    {   4.0f, 3, 12 },
    {   3.0f, 3, 11 },
    {   2.0f, 3,  6 },  // 03/006 = שתיים ✓
    {   1.5f, 3,  5 },  // אין הקלטה עדיין
    {   1.0f, 3,  4 },  // 03/004 = אחת ✓
    {   0.75f,3, 20 },  // אין הקלטה עדיין
    {   0.5f, 3,  1 },  // 03/001 = חצי ✓
    {   0.33f,3,  9 },  // אין הקלטה עדיין
    {   0.25f,3, 21 },  // אין הקלטה עדיין
};
static const int AMOUNT_TABLE_SIZE = 19;

// =====================================================
//  טבלת המרות: (ingredientId, unitId) → gramsPerUnit
//  הוסף שורות לפי הנתונים שיש בSQLite שלך
// =====================================================
struct ConversionEntry {
    int   ingredientId;
    int   unitId;
    float gramsPerUnit;
};

static const ConversionEntry CONVERSION_TABLE[] = {
    // ingredient 1 = קמח
    { 1, 1, 120.0f },   // 1 כוס קמח = 120 גרם
    { 1, 2, 15.0f  },   // 1 כף קמח  = 15 גרם
    // ingredient 2 = סוכר
    { 2, 1, 200.0f },   // 1 כוס סוכר = 200 גרם
    { 2, 2, 12.0f  },   // 1 כף סוכר  = 12 גרם
    // ingredient 3 = שמן
    { 3, 1, 220.0f },   // 1 כוס שמן  = 220 גרם
    { 3, 2, 14.0f  },   // 1 כף שמן   = 14 גרם
    // ingredient 4 = חלב
    { 4, 1, 240.0f },   // 1 כוס חלב  = 240 גרם
    { 4, 2, 15.0f  },   // 1 כף חלב   = 15 גרם
    // ingredient 5 = ביצה  (unit 3 = ביצה/יחידה)
    { 5, 3, 55.0f  },   // 1 ביצה   = 55 גרם
    // ingredient 7 = שמנת מתוקה (unit 6 = מ"ל, 1מ"ל=1גרם)
    { 7, 6, 1.0f   },   // 1 מ"ל שמנת = 1 גרם
};
static const int CONVERSION_TABLE_SIZE = 11;

// unit id = 4 → גרמים (אין המרה) — תואם ל-unitId=4 (גרם) ב-SQLite
static const int UNIT_ID_GRAMS = 4;

// =====================================================
//  פונקציות עזר
// =====================================================

// מחזיר gramsPerUnit, או -1 אם לא נמצא
inline float getGramsPerUnit(int ingredientId, int unitId) {
    if (unitId == UNIT_ID_GRAMS) return 1.0f;
    for (int i = 0; i < CONVERSION_TABLE_SIZE; i++) {
        if (CONVERSION_TABLE[i].ingredientId == ingredientId &&
            CONVERSION_TABLE[i].unitId       == unitId) {
            return CONVERSION_TABLE[i].gramsPerUnit;
        }
    }
    return -1.0f; // לא נמצא
}

// מוצא את הAmountEntry הגדולה ביותר שקטנה או שווה ל-val
// מחזיר אינדקס, או -1 אם val < הערך הקטן ביותר בטבלה
inline int findAmountIndex(float val) {
    for (int i = 0; i < AMOUNT_TABLE_SIZE; i++) {
        if (AMOUNT_TABLE[i].value <= val + 0.01f) return i;
    }
    return -1;
}

// =====================================================
//  טבלת סוגי קצף: (foamTypeId) → heightPerGram
//  heightPerGram = כמה ס"מ גובה מתקבלים מכל גרם חומר מוקצף
//
//  !! ערכים זמניים — יש לכייל בניסוי מעשי !!
//  שיטת כיול: הקצף X גרם, מדוד גובה, חלק: גובה / X
// =====================================================
struct FoamTypeEntry {
    int   id;
    char  name[24];
    float heightPerGram;  // ס"מ לגרם — דורש כיול
};

static const FoamTypeEntry FOAM_TYPES_TABLE[] = {
    { 1, "חלמון",          0.030f },  // !! זמני — יש לכייל
    { 2, "חלבון",          0.060f },  // !! זמני — חלבון מקציף הרבה יותר מחלמון
    { 3, "שמנת מתוקה",    0.032f },  // !! זמני — בסיס: 245g → ~8cm
    { 4, "קצפת צמחית",    0.038f },  // !! זמני — בסיס: 210g → ~8cm
    { 5, "Whole Egg",       0.045f },  // !! זמני — ביצה שלמה; יש לכייל
};
static const int FOAM_TYPES_TABLE_SIZE = 5;

// מחזיר heightPerGram לפי foamTypeId, או -1 אם לא נמצא
inline float getFoamHeightPerGram(int foamTypeId) {
    for (int i = 0; i < FOAM_TYPES_TABLE_SIZE; i++) {
        if (FOAM_TYPES_TABLE[i].id == foamTypeId)
            return FOAM_TYPES_TABLE[i].heightPerGram;
    }
    return -1.0f;
}

// =====================================================
//  טבלת שמות רכיבים באנגלית — לתצוגה על מסך ה-TFT
//
//  חייב להיות מסונכרן עם עמודת name_en בטבלת ingredients ב-SQLite.
//  כשמוסיפים רכיב חדש: מוסיפים שורה כאן + ב-SQLite + הקלטה ל-SD.
// =====================================================
struct IngredientNameEntry {
    int  id;
    char nameEn[24];
};

static const IngredientNameEntry INGREDIENT_NAMES[] = {
    { 1, "Flour"           },
    { 2, "Sugar"           },
    { 3, "Oil"             },
    { 4, "Milk"            },
    { 5, "Egg"             },
    { 7, "Heavy Cream"     },
    { 8, "Nutella"         },  // רכיב 8 — folder 01, record 08
    { 9, "Chocolate"       },  // רכיב 9 — folder 01, record 09 (להקליט)
};
static const int INGREDIENT_NAMES_SIZE = 8;

// מחזיר שם באנגלית לפי ingredientId, או "Unknown" אם לא נמצא
inline const char* getIngredientName(int ingredientId) {
    for (int i = 0; i < INGREDIENT_NAMES_SIZE; i++) {
        if (INGREDIENT_NAMES[i].id == ingredientId)
            return INGREDIENT_NAMES[i].nameEn;
    }
    return "Unknown";
}
