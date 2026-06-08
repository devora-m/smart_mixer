#pragma once
#include <Arduino.h>

// =====================================================
//  מבנה נתונים למתכונים קבועים
// =====================================================

// מרכיב בתוך שלב (כמות + כלי + חומר + גרמים מחושבים)
struct BuiltinIngredient {
    float   amount;        // כמות (לפי baseServings)
    int     amountFolder;  // תיקיית הקלטת כמות (03)
    int     amountRecord;  // קובץ הקלטת כמות
    int     unitId;        // id ב-SQLite (לחישוב גרמים)
    int     unitFolder;    // תיקיית הקלטת כלי (02)
    int     unitRecord;    // קובץ הקלטת כלי
    int     ingredientId;  // id ב-SQLite (לחישוב גרמים)
    int     ingFolder;     // תיקיית הקלטת חומר (01)
    int     ingRecord;     // קובץ הקלטת חומר
};

// שלב במתכון
struct BuiltinStep {
    char    type[20];      // "ADD", "MIX", "WHIP", "MIX_ADD", "WHIP_ADD", "INSTRUCTION", "FINISH"

    // --- שדות ADD / MIX_ADD / WHIP_ADD: רכיבים להוספה ---
    BuiltinIngredient ingredients[4];
    int     ingredientCount;

    // --- שדות MIX / MIX_ADD: ערבוב ---
    int     motorSpeed;    // 1-10
    int     durationSec;

    // --- שדות WHIP / WHIP_ADD: הקצפה ---
    float   foamIngAmount;
    int     foamIngUnitId;
    int     foamIngredientId;
    int     foamTypeId;

    // --- שדות INSTRUCTION: הוראה בטקסט ---
    char    instructionText[64];  // טקסט להצגה על מסך TFT
};

struct BuiltinRecipe {
    int     code;
    char    nameEn[32];     // שם באנגלית — לתצוגה על מסך TFT
    int     baseServings;
    int     stepCount;
    BuiltinStep steps[8];   // מקסימום 8 שלבים למתכון
};

// =====================================================
//  מסד המתכונים הקבועים
//  SD card: תיקייה 01=חומרים, 02=כלים, 03=כמויות
// =====================================================
static const BuiltinRecipe BUILTIN_RECIPES[] = {
    {
        1, "Sponge Cake", 6, 5,
        {
            // שלב 0: הוספת 2 כוסות קמח
            {
                "ADD",
                {{ 2.0f, 3, 6, 1, 2, 1, 1, 1, 1 }}, // 2 כוסות קמח
                1,
                0, 0,
                0.0f, 0, 0, 0
            },
            // שלב 1: הוספת 1 ביצה
            {
                "ADD",
                {{ 1.0f, 3, 4, 3, 2, 3, 5, 1, 5 }}, // 1 ביצה
                1,
                0, 0,
                0.0f, 0, 0, 0
            },
            // שלב 2: הוספת 2 כוסות חלב
            {
                "ADD",
                {{ 2.0f, 3, 6, 1, 2, 1, 4, 1, 4 }}, // 2 כוסות חלב
                1,
                0, 0,
                0.0f, 0, 0, 0
            },
            // שלב 3: הוראת ביניים — לוודא שכל החומרים בקערה לפני הערבוב
            {
                "INSTRUCTION",
                {}, 0,
                0, 0,
                0.0f, 0, 0, 0,
                "Make sure all ingredients are in the bowl before mixing"
            },
            // שלב 4: ערבוב 120 שניות במהירות 6
            {
                "MIX",
                {}, 0,
                6, 120,
                0.0f, 0, 0, 0
            }
        }
    },
    {
        2, "Whipped Cream", 4, 1,
        {
            // שלב 0: הקצפת 250 מ"ל שמנת מתוקה עד גובה מחושב
            // targetDistance מחושב ב-exec_prepare() מ-FOAM_TYPES_TABLE
            {
                "WHIP",
                {}, 0,
                7, 0,
                250.0f, 6, 7, 3  // foamIngAmount=250ml, unitId=6(מ"ל), ingId=7(שמנת), foamTypeId=3
            }
        }
    },
    {
        3, "Nutella Cookies", 12, 7,
        {
            // שלב 0: הקצפת ביצה אחת, אחר כך הוספת 200ג נוטלה + 125ג קמח תוך כדי ערבול
            {
                "WHIP_ADD",
                {
                    // amountRecord 19=מאתיים, unitRecord 4=גרם, ingRecord 8=נוטלה
                    {200.0f, 3, 19, 4, 2, 4, 8, 1, 8},
                    // amountRecord 22=מאהעשריםוחמש, unitRecord 4=גרם, ingRecord 1=קמח
                    {125.0f, 3, 22, 4, 2, 4, 1, 1, 1},
                },
                2,        // ingredientCount
                7, 30,    // motorSpeed=7, durationSec=30 (ערבוב נוסף אחרי הרכיב האחרון)
                1.0f, 3, 5, 5  // 1 ביצה (unitId=3=יחידה), ingId=5, foamType=5(Whole Egg)
            },
            // שלבים 1-6: הוראות ידניות לסיום המתכון
            {
                "INSTRUCTION",
                {}, 0, 0, 0, 0.0f, 0, 0, 0,
                "Put mixture in fridge for 10-15 minutes"
            },
            {
                "INSTRUCTION",
                {}, 0, 0, 0, 0.0f, 0, 0, 0,
                "Preheat oven to 180 degrees"
            },
            {
                "INSTRUCTION",
                {}, 0, 0, 0, 0.0f, 0, 0, 0,
                "Form balls on sheet, press dimple in center"
            },
            {
                "INSTRUCTION",
                {}, 0, 0, 0, 0.0f, 0, 0, 0,
                "Bake for 7-8 minutes"
            },
            {
                "INSTRUCTION",
                {}, 0, 0, 0, 0.0f, 0, 0, 0,
                "Let cookies cool completely"
            },
            {
                "INSTRUCTION",
                {}, 0, 0, 0, 0.0f, 0, 0, 0,
                "Fill dimples with Nutella chocolate"
            }
        }
    }
};

static const int BUILTIN_RECIPE_COUNT = 3;

// פונקציית שליפה לפי קוד
inline const BuiltinRecipe* getBuiltinRecipe(int code) {
    for (int i = 0; i < BUILTIN_RECIPE_COUNT; i++) {
        if (BUILTIN_RECIPES[i].code == code) return &BUILTIN_RECIPES[i];
    }
    return nullptr;
}
