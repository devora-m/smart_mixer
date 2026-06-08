#include "RecipeExecutor.h"
#include "builtin_recipes.h"
#include "builtin_conversions.h"
#include "Communication.h"
#include "UI.h"
#include <Arduino.h>
#include <string.h>

// =====================================================
//  מצב גלובלי
// =====================================================
static ResolvedRecipe g_recipe;
static bool           g_running = false;

// =====================================================
//  עזר: פיצול כמות לשני שברים
//  ממלא עד 2 ResolvedIngredient בתוך פלט[]
//  מחזיר כמה נוספו (1 או 2)
// =====================================================
static int splitAmount(float scaledAmount,
                       int unitFolder, int unitRecord,
                       int ingFolder,  int ingRecord,
                       float gramsPerUnit,
                       ResolvedIngredient* out)
{
    int count = 0;

    // שבר ראשון — הגדול ביותר שקטן/שווה ל-scaledAmount
    int idx1 = findAmountIndex(scaledAmount);
    if (idx1 < 0) {
        // קטן מ-0.25 — שולחים "רבע" בכל מקרה
        idx1 = AMOUNT_TABLE_SIZE - 1;
    }
    float val1 = AMOUNT_TABLE[idx1].value;

    ResolvedIngredient& r1 = out[count++];
    r1.targetGrams  = val1 * gramsPerUnit;
    r1.amountFolder = AMOUNT_TABLE[idx1].folder;
    r1.amountRecord = AMOUNT_TABLE[idx1].record;
    r1.unitFolder   = unitFolder;
    r1.unitRecord   = unitRecord;
    r1.ingFolder    = ingFolder;
    r1.ingRecord    = ingRecord;

    // שאריות
    float remainder = scaledAmount - val1;
    if (remainder >= 0.1f) {
        int idx2 = findAmountIndex(remainder);
        if (idx2 >= 0) {
            float val2 = AMOUNT_TABLE[idx2].value;
            ResolvedIngredient& r2 = out[count++];
            r2.targetGrams  = val2 * gramsPerUnit;
            r2.amountFolder = AMOUNT_TABLE[idx2].folder;
            r2.amountRecord = AMOUNT_TABLE[idx2].record;
            r2.unitFolder   = unitFolder;
            r2.unitRecord   = unitRecord;
            r2.ingFolder    = ingFolder;
            r2.ingRecord    = ingRecord;
        }
    }
    return count;
}

// =====================================================
//  עזר: חישוב שלב ADD
//  ממלא את ResolvedStep מ-BuiltinIngredient
// =====================================================
static void resolveAddStep(ResolvedStep& out,
                           const BuiltinStep& src,
                           int servings, int baseServings)
{
    out.ingredientCount   = 0;
    out.currentIngredient = 0;

    for (int i = 0; i < src.ingredientCount && out.ingredientCount < 7; i++) {
        const BuiltinIngredient& bi = src.ingredients[i];

        // חישוב כמות מותאמת למנות
        float scaled = (bi.amount / (float)baseServings) * (float)servings;

        // אם unitId == 0 → גרמים ישירות
        float gPerUnit = getGramsPerUnit(bi.ingredientId, bi.unitId);
        if (gPerUnit < 0) {
            // המרה לא נמצאה — משתמשים ב-1 כברירת מחדל ומדפיסים אזהרה
            Serial.print("[Exec] WARNING: no conversion for ing=");
            Serial.print(bi.ingredientId);
            Serial.print(" unit="); Serial.println(bi.unitId);
            gPerUnit = 1.0f;
        }

        // פיצול לשברים
        int added = splitAmount(scaled,
                                bi.unitFolder, bi.unitRecord,
                                bi.ingFolder,  bi.ingRecord,
                                gPerUnit,
                                &out.ingredients[out.ingredientCount]);
        out.ingredientCount += added;
    }
}

// =====================================================
//  exec_prepare
// =====================================================
bool exec_prepare(int code, int servings, bool /*isBuiltin*/) {
    memset(&g_recipe, 0, sizeof(g_recipe));
    g_running = false;

    // נסה builtin קודם תמיד
    const BuiltinRecipe* src = getBuiltinRecipe(code);
    if (!src) {
        // לא נמצא ב-builtin — fallback לשרת (TODO: Phase 2)
        Serial.print("[Exec] Code "); Serial.print(code);
        Serial.println(" not in builtin — server fetch not implemented yet");
        return false;
    }

    int base = src->baseServings;

    for (int s = 0; s < src->stepCount && s < 8; s++) {
        const BuiltinStep& bs = src->steps[s];
        ResolvedStep&      rs = g_recipe.steps[s];

        strncpy(rs.type, bs.type, sizeof(rs.type) - 1);
        rs.motorSpeed        = bs.motorSpeed;
        rs.durationSec       = bs.durationSec;
        rs.foamPhoneDone     = false;
        rs.currentIngredient = 0;

        if (strcmp(bs.type, "WHIP") == 0 || strcmp(bs.type, "WHIP_ADD") == 0) {
            // חישוב targetDistance מתוך הרכיב הראשי המוקצף + טבלת סוגי הקצף
            float scaledAmount = (bs.foamIngAmount / (float)base) * (float)servings;
            float gPerUnit     = getGramsPerUnit(bs.foamIngredientId, bs.foamIngUnitId);
            if (gPerUnit < 0) {
                Serial.print("[Exec] WARNING: no foam conversion for ing=");
                Serial.print(bs.foamIngredientId);
                Serial.print(" unit="); Serial.println(bs.foamIngUnitId);
                gPerUnit = 1.0f;
            }
            float scaledGrams     = scaledAmount * gPerUnit;
            float heightPerGram   = getFoamHeightPerGram(bs.foamTypeId);
            if (heightPerGram < 0) {
                Serial.print("[Exec] WARNING: foamTypeId not found: ");
                Serial.println(bs.foamTypeId);
                heightPerGram = 0.032f; // ברירת מחדל זמנית
            }
            rs.targetDistance = scaledGrams * heightPerGram;

            Serial.print("[Exec] WHIP targetDistance=");
            Serial.print(rs.targetDistance);
            Serial.print("cm (");
            Serial.print(scaledGrams);
            Serial.println("g)");

            // שלב WHIP_ADD מכיל גם רכיבים להוספה אחרי ההקצפה
            if (strcmp(bs.type, "WHIP_ADD") == 0) {
                resolveAddStep(rs, bs, servings, base);
            } else {
                rs.ingredientCount = 0;
            }

        } else if (strcmp(bs.type, "ADD")     == 0 ||
                   strcmp(bs.type, "MIX_ADD") == 0) {
            rs.targetDistance = 0.0f;
            resolveAddStep(rs, bs, servings, base);

        } else if (strcmp(bs.type, "INSTRUCTION") == 0) {
            // העתקת טקסט ההוראה ל-ResolvedStep
            rs.targetDistance  = 0.0f;
            rs.ingredientCount = 0;
            strncpy(rs.instructionText, bs.instructionText, sizeof(rs.instructionText) - 1);
            rs.instructionText[sizeof(rs.instructionText) - 1] = '\0';

        } else {
            // MIX / FINISH — אין רכיבים ואין מרחק
            rs.targetDistance  = 0.0f;
            rs.ingredientCount = 0;
            rs.instructionText[0] = '\0';
        }
    }

    g_recipe.totalSteps  = src->stepCount;
    g_recipe.currentStep = 0;
    g_recipe.isReady     = true;
    g_running            = true;

    Serial.print("[Exec] Ready: "); Serial.print(src->nameEn);
    Serial.print(", steps="); Serial.print(g_recipe.totalSteps);
    Serial.print(", servings="); Serial.println(servings);
    return true;
}

// =====================================================
//  exec_startCurrentStep
// =====================================================
void exec_startCurrentStep() {
    if (!g_running) return;

    ResolvedStep& step = g_recipe.steps[g_recipe.currentStep];
    Serial.print("[Exec] Starting step "); Serial.print(g_recipe.currentStep);
    Serial.print(" type="); Serial.println(step.type);

    if (strcmp(step.type, "MIX") == 0) {
        comm_sendMixCommand(step.motorSpeed, step.durationSec);

    } else if (strcmp(step.type, "WHIP") == 0) {
        comm_sendWhipCommand(step.motorSpeed, step.targetDistance);

    } else if (strcmp(step.type, "ADD") == 0) {
        if (step.ingredientCount == 0) { exec_onDone(); return; }
        const ResolvedIngredient& ri = step.ingredients[0];
        step.currentIngredient = 0;
        comm_sendAddCommand(ri.amountFolder, ri.amountRecord,
                            ri.unitFolder,   ri.unitRecord,
                            ri.ingFolder,    ri.ingRecord,
                            ri.targetGrams);

    } else if (strcmp(step.type, "MIX_ADD") == 0) {
        if (step.ingredientCount == 0) { exec_onDone(); return; }
        const ResolvedIngredient& ri = step.ingredients[0];
        step.currentIngredient = 0;
        comm_sendMixAddCommand(step.motorSpeed,
                               ri.amountFolder, ri.amountRecord,
                               ri.targetGrams,
                               0); // duration=0 עד שהמרכיב האחרון יגמר

    } else if (strcmp(step.type, "WHIP_ADD") == 0) {
        // שלב א': הקצפה
        step.foamPhoneDone = false;
        comm_sendWhipCommand(step.motorSpeed, step.targetDistance);

    } else if (strcmp(step.type, "INSTRUCTION") == 0) {
        // מציג טקסט על המסך — המתכון עוצר עד ללחיצת "המשך"
        ui_showInstruction(step.instructionText);

    } else {
        // FINISH — עובר מיידית
        exec_onDone();
    }
}

// =====================================================
//  exec_onDone  — נקרא כש"DONE" מגיע מהבקר
// =====================================================
void exec_onDone() {
    if (!g_running) return;

    ResolvedStep& step = g_recipe.steps[g_recipe.currentStep];

    // --- ADD: שלח את המרכיב הבא, או עבור לשלב הבא ---
    if (strcmp(step.type, "ADD") == 0) {
        step.currentIngredient++;
        if (step.currentIngredient < step.ingredientCount) {
            const ResolvedIngredient& ri = step.ingredients[step.currentIngredient];
            comm_sendAddCommand(ri.amountFolder, ri.amountRecord,
                                ri.unitFolder,   ri.unitRecord,
                                ri.ingFolder,    ri.ingRecord,
                                ri.targetGrams);
            return;
        }
        // כל המרכיבים הסתיימו → שלב הבא

    // --- MIX_ADD: שלח את המרכיב הבא, בסוף שלח ערבוב סופי ---
    } else if (strcmp(step.type, "MIX_ADD") == 0) {
        step.currentIngredient++;
        if (step.currentIngredient < step.ingredientCount) {
            const ResolvedIngredient& ri = step.ingredients[step.currentIngredient];
            bool isLast = (step.currentIngredient == step.ingredientCount - 1);
            comm_sendMixAddCommand(step.motorSpeed,
                                   ri.amountFolder, ri.amountRecord,
                                   ri.targetGrams,
                                   isLast ? step.durationSec : 0);
            return;
        }
        // כל המרכיבים הסתיימו → שלב הבא

    // --- WHIP_ADD: שלב א' (הקצפה) הסתיים → שלב ב' (הוספה) ---
    } else if (strcmp(step.type, "WHIP_ADD") == 0) {
        if (!step.foamPhoneDone) {
            step.foamPhoneDone = true;
            step.currentIngredient = 0;
            if (step.ingredientCount == 0) { /* נעבור לשלב הבא */ }
            else {
                const ResolvedIngredient& ri = step.ingredients[0];
                comm_sendWhipAddCommand(step.motorSpeed, step.targetDistance,
                                        ri.amountFolder, ri.amountRecord,
                                        ri.targetGrams,
                                        0);
                return;
            }
        } else {
            step.currentIngredient++;
            if (step.currentIngredient < step.ingredientCount) {
                const ResolvedIngredient& ri = step.ingredients[step.currentIngredient];
                bool isLast = (step.currentIngredient == step.ingredientCount - 1);
                comm_sendWhipAddCommand(step.motorSpeed, step.targetDistance,
                                        ri.amountFolder, ri.amountRecord,
                                        ri.targetGrams,
                                        isLast ? step.durationSec : 0);
                return;
            }
        }
    }

    // --- עבור לשלב הבא ---
    g_recipe.currentStep++;
    if (g_recipe.currentStep >= g_recipe.totalSteps) {
        Serial.println("[Exec] Recipe complete!");
        g_running = false;
        ui_setScreen(SCREEN_SUCCESS);
    } else {
        exec_startCurrentStep();
    }
}

// =====================================================
//  Getters
// =====================================================
const ResolvedStep* exec_getCurrentStep() {
    if (!g_running) return nullptr;
    return &g_recipe.steps[g_recipe.currentStep];
}

bool exec_isRunning() { return g_running; }
