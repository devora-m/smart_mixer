#pragma once
#include <Arduino.h>

// =====================================================
//  מבני נתונים — המתכון המחושב
// =====================================================

// מרכיב אחד לאחר חישוב מנות + המרה
struct ResolvedIngredient {
    float  targetGrams;       // גרמים לשקילה (שדה targetWeight לבקר)
    int    amountFolder;
    int    amountRecord;
    int    unitFolder;
    int    unitRecord;
    int    ingFolder;
    int    ingRecord;
};

// שלב מחושב
struct ResolvedStep {
    char   type[20];
    // מרכיבים (עד 8 — כי כל מרכיב יכול להתפצל ל-2 שברים)
    ResolvedIngredient ingredients[8];
    int    ingredientCount;
    int    currentIngredient;   // איזה מרכיב שולחים כרגע
    // פרמטרי מנוע
    int    motorSpeed;
    int    durationSec;
    float  targetDistance;
    // מצב פנימי לשלבי WHIP_ADD
    bool   foamPhoneDone;       // true = שלב ההקצפה הסתיים
    // טקסט הוראה — רלוונטי לשלב INSTRUCTION בלבד
    char   instructionText[64];
};

// המתכון המלא לאחר חישוב
struct ResolvedRecipe {
    bool          isReady;
    int           totalSteps;
    int           currentStep;
    ResolvedStep  steps[8];
};

// =====================================================
//  API ציבורי
// =====================================================

// הכנת המתכון: טוען, מחשב, שומר ב-resolvedRecipe
// code       = קוד המתכון שהוקלד
// servings   = מספר המנות שהמשתמש בחר
// isBuiltin  = true = מתכון קבוע, false = מהשרת (לא ממומש עדיין)
bool exec_prepare(int code, int servings, bool isBuiltin);

// מתחיל את השלב הנוכחי (שולח פקודה לבקר)
void exec_startCurrentStep();

// נקרא כאשר מגיע "DONE" מהבקר
void exec_onDone();

// מחזיר את השלב הנוכחי (לצורך UI)
const ResolvedStep* exec_getCurrentStep();

// האם המתכון פעיל?
bool exec_isRunning();
