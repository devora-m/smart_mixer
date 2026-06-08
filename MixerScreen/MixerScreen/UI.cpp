#include "UI.h"
#include "Config.h"
#include "Communication.h"
#include "builtin_recipes.h"
#include "RecipeExecutor.h"
#include <TFT_eSPI.h>

static TFT_eSPI tft = TFT_eSPI();
static ScreenType currentScreen = SCREEN_HOME;

// ===== משתנים משותפים =====
static float   liveWeight    = 0.0f;
static char    liveStatus[24] = "";
static int     pendingCode   = 0;
static bool    pendingBuiltin = true;
static int     desiredServings = 1;
static char    servingsStr[4] = "1";
static int     servingsIndex  = 1;
static char    instructionBuf[64] = "";  // טקסט נוכחי למסך INSTRUCTION
static char    stopStateBuf[32]   = "";  // שם ה-state שהיה בעת ה-STOP

// ===== רשימת מתכונים לבחירה =====
static const BuiltinRecipe* recipeList[20];
static int recipeListCount    = 0;
static int recipeScrollOffset = 0;  // איזה מתכון ראשון מוצג (גלילה)

// ===== מבנה כפתור =====
struct UIButton {
    uint16_t x, y, w, h;
    uint16_t color;
    const char* label;
    void (*onPress)();
};

// ===== פרוטוטייפים =====
static void actionBuiltinRecipes();
static void actionPersonalRecipes();
static void actionServingsPlus();
static void actionServingsMinus();
static void actionServingsConfirm();
static void actionServingsCancel();
static void actionConfirmCode();
static void actionCancelCode();
static void actionByCode();       // → SCREEN_CODE_INPUT
static void actionFilter();       // → SCREEN_FILTER (עוד לא קיים)

// ===== כפתורי מסך הבית =====
// גובה מסך 320px — 4 כפתורים בגובה 50px עם רווח 10px ביןיהם, מתחיל מ-y=70
static const UIButton homeButtons[] = {
    {20,  70, 200, 50, TFT_BLUE,       "Regular recipes",  actionBuiltinRecipes},
    {20, 130, 200, 50, TFT_ORANGE,     "Personal recipes", actionPersonalRecipes},
    {20, 190, 200, 50, TFT_DARKGREEN,  "By code",          actionByCode},
    {20, 250, 200, 50, TFT_PURPLE,     "Filter",           actionFilter}
};

// ===== כפתורי מסך מנות =====
static const UIButton servingsButtons[] = {
    {160, 120, 50, 50, TFT_GREEN, "+",   actionServingsPlus},
    {30,  120, 50, 50, TFT_RED,   "-",   actionServingsMinus},
    {40,  220, 70, 50, TFT_GREEN, "OK",  actionServingsConfirm},
    {130, 220, 70, 50, TFT_RED,   "Back",actionServingsCancel}
};

// ===== כפתורי מסך קוד =====
static char currentCode[10] = "";
static int  codeIndex = 0;
static const UIButton codeScreenButtons[] = {
    {40,  230, 70, 50, TFT_GREEN, "OK",  actionConfirmCode},
    {130, 230, 70, 50, TFT_RED,   "Back",actionCancelCode}
};

//  פעולות כפתורים
static void actionByCode() {
    pendingBuiltin = false;
    // מעבר ישיר למסך הקוד (המשתמש יקליד קוד מתכון )
    comm_sendSelectCodeCommand();
    ui_setScreen(SCREEN_CODE_INPUT);
}

static void actionPersonalRecipes() {
    //כל המתכונים מהשרת
}

static void actionBuiltinRecipes() {
    pendingBuiltin = true;
    static const BuiltinRecipe* ptrs[20];
    int n = 0;
    for (int i = 0; i < BUILTIN_RECIPE_COUNT && n < 20; i++)
        ptrs[n++] = &BUILTIN_RECIPES[i];
    ui_showRecipeList(ptrs, n);
}

static void actionFilter() {
    //מסך סינון מתכונים לפי מרכיב/קטגוריה/קושי ' 
}

static void actionConfirmCode() {
    if (codeIndex == 0) return;
    pendingCode = atoi(currentCode);
    // איפוס שדות הקוד
    currentCode[0] = '\0';
    codeIndex = 0;
    // מעבר לבחירת מנות
    desiredServings = 1;
    servingsStr[0] = '1'; servingsStr[1] = '\0';
    servingsIndex = 1;
    ui_setScreen(SCREEN_SERVINGS_INPUT);
}

static void actionCancelCode() {
    currentCode[0] = '\0';
    codeIndex = 0;
    comm_sendSelectCodeCommand();
    ui_setScreen(SCREEN_HOME);
}

static void actionServingsPlus() {
    if (desiredServings < 99) {
        desiredServings++;
        snprintf(servingsStr, sizeof(servingsStr), "%d", desiredServings);
        ui_drawCurrentScreen();
    }
}

static void actionServingsMinus() {
    if (desiredServings > 1) {
        desiredServings--;
        snprintf(servingsStr, sizeof(servingsStr), "%d", desiredServings);
        ui_drawCurrentScreen();
    }
}

static void actionServingsConfirm() {
    Serial.print("[UI] קוד=");
    Serial.print(pendingCode);
    Serial.print(" מנות=");
    Serial.println(desiredServings);

    if (!exec_prepare(pendingCode, desiredServings, pendingBuiltin)) {
        // מתכון לא נמצא — חזר לבית
        ui_setScreen(SCREEN_HOME);
        return;
    }
    ui_setScreen(SCREEN_RUNNING);
    exec_startCurrentStep();
}

static void actionServingsCancel() {
    ui_setScreen(SCREEN_HOME);
}

// =====================================================
//  אתחול ומעבר מסכים
// =====================================================
void ui_init() {
    tft.init();
    tft.setRotation(SCREEN_ROTATION);
    uint16_t cal[5] = {256, 3514, 364, 3559, 4};
    tft.setTouch(cal);
    tft.fillScreen(TFT_BLACK);
    ui_drawCurrentScreen();
}

void ui_setScreen(ScreenType s) {
    currentScreen = s;
    tft.fillScreen(TFT_BLACK);
    ui_drawCurrentScreen();
}

void ui_setPendingRecipeCode(int code, bool isBuiltin) {
    pendingCode    = code;
    pendingBuiltin = isBuiltin;
}

// =====================================================
//  ציור מסכים
// =====================================================
void ui_drawCurrentScreen() {
    tft.setTextDatum(MC_DATUM);

    switch (currentScreen) {

        case SCREEN_HOME:
            tft.setTextColor(TFT_WHITE, TFT_BLACK);
            tft.drawString("צעד בטוח במטבח", 120, 40, 4);
            tft.drawString("בחרי סוג מתכון:", 120, 85, 2);
            for (auto &b : homeButtons) {
                tft.fillRoundRect(b.x, b.y, b.w, b.h, 10, b.color);
                tft.drawRoundRect(b.x, b.y, b.w, b.h, 10, TFT_WHITE);
                tft.setTextColor(TFT_WHITE);
                tft.drawString(b.label, b.x + b.w/2, b.y + b.h/2, 2);
            }
            break;

        case SCREEN_CODE_INPUT:
            tft.setTextColor(TFT_WHITE, TFT_BLACK);
            tft.drawString("הקש קוד מתכון:", 120, 40, 4);
            tft.fillRect(60, 80, 120, 50, TFT_BLACK);
            tft.drawRect(60, 80, 120, 50, TFT_WHITE);
            tft.setTextColor(TFT_YELLOW, TFT_BLACK);
            tft.drawString(currentCode[0] ? currentCode : "---", 120, 105, 4);
            for (auto &b : codeScreenButtons) {
                tft.fillRoundRect(b.x, b.y, b.w, b.h, 10, b.color);
                tft.setTextColor(TFT_WHITE);
                tft.drawString(b.label, b.x + b.w/2, b.y + b.h/2, 2);
            }
            break;

        case SCREEN_SERVINGS_INPUT:
            tft.setTextColor(TFT_WHITE, TFT_BLACK);
            tft.drawString("כמה מנות?", 120, 40, 4);
            // הצגת מספר המנות
            tft.fillRect(85, 110, 70, 60, TFT_BLACK);
            tft.drawRect(85, 110, 70, 60, TFT_WHITE);
            tft.setTextColor(TFT_YELLOW, TFT_BLACK);
            tft.drawString(servingsStr, 120, 140, 4);
            for (auto &b : servingsButtons) {
                tft.fillRoundRect(b.x, b.y, b.w, b.h, 10, b.color);
                tft.setTextColor(TFT_WHITE);
                tft.drawString(b.label, b.x + b.w/2, b.y + b.h/2, 2);
            }
            break;

        case SCREEN_RUNNING:
            tft.setTextColor(TFT_WHITE, TFT_BLACK);
            tft.drawString("פעיל...", 120, 30, 2);
            // שורת סטטוס
            tft.fillRect(0, 55, 240, 30, TFT_BLACK);
            tft.setTextColor(TFT_CYAN, TFT_BLACK);
            tft.drawString(liveStatus, 120, 70, 2);
            // שורת משקל
            tft.drawString("משקל:", 120, 110, 2);
            tft.fillRect(40, 130, 160, 50, TFT_BLACK);
            tft.drawRect(40, 130, 160, 50, TFT_WHITE);
            tft.setTextColor(TFT_GREEN, TFT_BLACK);
            char weightBuf[16];
            snprintf(weightBuf, sizeof(weightBuf), "%.1f g", liveWeight);
            tft.drawString(weightBuf, 120, 155, 4);
            break;

        case SCREEN_SUCCESS:
            tft.setTextColor(TFT_GREEN, TFT_BLACK);
            tft.drawString("ביצוע מוצלח!", 120, 100, 4);
            tft.setTextColor(TFT_WHITE, TFT_BLACK);
            tft.drawString("בתיאבון!", 120, 160, 2);
            // כפתור חזור לבית
            tft.fillRoundRect(60, 220, 120, 50, 10, TFT_BLUE);
            tft.setTextColor(TFT_WHITE);
            tft.drawString("בית", 120, 245, 2);
            break;

        case SCREEN_RECIPE_LIST: {
            tft.setTextColor(TFT_WHITE, TFT_BLACK);
            tft.drawString("Choose Recipe", 120, 15, 2);
            tft.drawFastHLine(0, 30, 240, TFT_DARKGREY);

            // מציג 3 קלפים 
            const int CARD_H = 68;
            const int CARD_Y0 = 35;
            const int VISIBLE = 3;
            for (int i = 0; i < VISIBLE; i++) {
                int idx = recipeScrollOffset + i;
                int cy  = CARD_Y0 + i * (CARD_H + 4);
                if (idx >= recipeListCount) {
                    // תא ריק במקום קלף חסר
                    tft.fillRoundRect(5, cy, 230, CARD_H, 6, TFT_DARKGREY);
                    continue;
                }
                const BuiltinRecipe* r = recipeList[idx];
                tft.fillRoundRect(5, cy, 230, CARD_H, 6, 0x2104);  // אפור כה
                tft.drawRoundRect(5, cy, 230, CARD_H, 6, TFT_DARKGREY);

                // שם מתכון
                tft.setTextDatum(ML_DATUM);
                tft.setTextColor(TFT_WHITE, 0x2104);
                tft.drawString(r->nameEn, 14, cy + 22, 2);

                // פרטים: מנות + שלבים
                char info[32];
                snprintf(info, sizeof(info), "Srv:%d  Steps:%d", r->baseServings, r->stepCount);
                tft.setTextColor(TFT_LIGHTGREY, 0x2104);
                tft.drawString(info, 14, cy + 46, 1);

                // חץ ימני
                tft.setTextDatum(MR_DATUM);
                tft.setTextColor(TFT_CYAN, 0x2104);
                tft.drawString(">", 228, cy + 34, 2);
            }

            // כפתורי ניווט
            tft.setTextDatum(MC_DATUM);
            uint16_t upCol   = (recipeScrollOffset > 0)                           ? TFT_WHITE : TFT_DARKGREY;
            uint16_t downCol = (recipeScrollOffset + VISIBLE < recipeListCount)   ? TFT_WHITE : TFT_DARKGREY;
            tft.setTextColor(upCol,   TFT_BLACK); tft.drawString("[ ^ ]",  60, 286, 2);
            tft.setTextColor(downCol, TFT_BLACK); tft.drawString("[ v ]", 180, 286, 2);
            tft.setTextColor(TFT_ORANGE, TFT_BLACK); tft.drawString("[ Back ]", 120, 308, 2);
            break;
        }

        case SCREEN_STOP: {
            // כותר
            tft.setTextColor(TFT_RED, TFT_BLACK);
            tft.drawString("Motor Stopped", 120, 25, 4);
            // שם המצב ברגע העצירה
            tft.setTextColor(TFT_DARKGREY, TFT_BLACK);
            tft.drawString(stopStateBuf, 120, 65, 2);
            tft.drawFastHLine(10, 85, 220, TFT_DARKGREY);
            // כפתור Continue (ירוק) — חוזר לאותו שלב
            tft.fillRoundRect(15, 105, 210, 55, 8, TFT_DARKGREEN);
            tft.setTextColor(TFT_WHITE, TFT_DARKGREEN);
            tft.drawString("Continue", 120, 132, 2);
            tft.setTextColor(TFT_LIGHTGREY, TFT_DARKGREEN);
            tft.drawString("restart current step", 120, 150, 1);
            // כפתור Skip (כתום) — דלג לשלב הבא
            tft.fillRoundRect(15, 170, 210, 55, 8, 0x8400);  // כתום כה
            tft.setTextColor(TFT_WHITE, 0x8400);
            tft.drawString("Skip", 120, 197, 2);
            tft.setTextColor(TFT_LIGHTGREY, 0x8400);
            tft.drawString("go to next step", 120, 215, 1);
            // כפתור Cancel (אדום) — ביטול וחזרה הביתה
            tft.fillRoundRect(15, 235, 210, 55, 8, TFT_RED);
            tft.setTextColor(TFT_WHITE, TFT_RED);
            tft.drawString("Cancel", 120, 262, 2);
            tft.setTextColor(TFT_LIGHTGREY, TFT_RED);
            tft.drawString("back to home", 120, 280, 1);
            break;
        }

        case SCREEN_INSTRUCTION: {
            tft.setTextColor(TFT_YELLOW, TFT_BLACK);
            tft.drawString("Instruction", 120, 20, 2);
            // טקסט ההוראה — עטיפה אוטומטית על-3 שורות
            tft.setTextColor(TFT_WHITE, TFT_BLACK);
            tft.setTextWrap(true);
            tft.setCursor(10, 60);
            tft.setTextFont(2);
            tft.print(instructionBuf);
            tft.setTextWrap(false);
            // כפתור Continue
            tft.fillRoundRect(60, 250, 120, 50, 10, TFT_GREEN);
            tft.setTextColor(TFT_WHITE);
            tft.setTextDatum(MC_DATUM);
            tft.drawString("Continue", 120, 275, 2);
            break;
        }

    }
}

// =====================================================
//  ui_showStopScreen — מציג מסך עצירת חירום
// =====================================================
void ui_showStopScreen(const char* stateAtStop) {
    strncpy(stopStateBuf, stateAtStop, sizeof(stopStateBuf) - 1);
    stopStateBuf[sizeof(stopStateBuf) - 1] = '\0';
    ui_setScreen(SCREEN_STOP);
}

// =====================================================
//  ui_showRecipeList — ממלא רשימה ועובר למסך בחירת מתכון
// =====================================================
void ui_showRecipeList(const BuiltinRecipe** items, int count) {
    for (int i = 0; i < count && i < 20; i++)
        recipeList[i] = items[i];
    recipeListCount    = count;
    recipeScrollOffset = 0;
    ui_setScreen(SCREEN_RECIPE_LIST);
}

// =====================================================
//  ui_showInstruction — מציג מסך הוראה
// =====================================================
void ui_showInstruction(const char* text) {
    strncpy(instructionBuf, text, sizeof(instructionBuf) - 1);
    instructionBuf[sizeof(instructionBuf) - 1] = '\0';
    ui_setScreen(SCREEN_INSTRUCTION);
}

// =====================================================
//  קלידת מקלדת מהבקר
// =====================================================
void ui_handleKeypadInput(char key) {
    if (currentScreen != SCREEN_CODE_INPUT) return;
    if (codeIndex < 9) {
        currentCode[codeIndex++] = key;
        currentCode[codeIndex]   = '\0';
        ui_drawCurrentScreen();
    }
}

// =====================================================
//  עדכוני משקל וסטטוס (מתקרא מ-Communication.cpp)
// =====================================================
void ui_setWeight(float grams) {
    liveWeight = grams;
    if (currentScreen == SCREEN_RUNNING) {
        // עדכון רק את אזור המשקל - בלי ציור מחדש של כל המסך
        tft.fillRect(40, 130, 160, 50, TFT_BLACK);
        tft.drawRect(40, 130, 160, 50, TFT_WHITE);
        tft.setTextDatum(MC_DATUM);
        tft.setTextColor(TFT_GREEN, TFT_BLACK);
        char weightBuf[16];
        snprintf(weightBuf, sizeof(weightBuf), "%.1f g", liveWeight);
        tft.drawString(weightBuf, 120, 155, 4);
    }
}

void ui_setStatus(const char* text) {
    strncpy(liveStatus, text, sizeof(liveStatus) - 1);
    liveStatus[sizeof(liveStatus) - 1] = '\0';
    if (currentScreen == SCREEN_RUNNING) {
        tft.fillRect(0, 55, 240, 30, TFT_BLACK);
        tft.setTextDatum(MC_DATUM);
        tft.setTextColor(TFT_CYAN, TFT_BLACK);
        tft.drawString(liveStatus, 120, 70, 2);
    }
}

// =====================================================
//  זיהוי לחיצות
// =====================================================
void ui_pumpTouch() {
    uint16_t tx, ty;
    if (!tft.getTouch(&tx, &ty)) return;

    const UIButton* buttons = nullptr;
    int count = 0;

    if (currentScreen == SCREEN_HOME) {
        buttons = homeButtons;
        count   = 4;
    } else if (currentScreen == SCREEN_CODE_INPUT) {
        buttons = codeScreenButtons;
        count   = 2;
    } else if (currentScreen == SCREEN_SERVINGS_INPUT) {
        buttons = servingsButtons;
        count   = 4;
    }

    if (buttons) {
        for (int i = 0; i < count; i++) {
            const UIButton &b = buttons[i];
            if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
                b.onPress();
                delay(200);
                return;
            }
        }
    }

    // מסך RECIPE_LIST: לחיצות על קלף, עלייה/ירידה, חזרה
    if (currentScreen == SCREEN_RECIPE_LIST) {
        const int CARD_H = 68;
        const int CARD_Y0 = 35;
        const int VISIBLE = 3;

        // לחיצה על קלף
        for (int i = 0; i < VISIBLE; i++) {
            int idx = recipeScrollOffset + i;
            if (idx >= recipeListCount) break;
            int cy = CARD_Y0 + i * (CARD_H + 4);
            if (ty >= (uint16_t)cy && ty <= (uint16_t)(cy + CARD_H) && tx >= 5 && tx <= 235) {
                pendingCode = recipeList[idx]->code;
                desiredServings = 1;
                servingsStr[0] = '1'; servingsStr[1] = '\0';
                ui_setScreen(SCREEN_SERVINGS_INPUT);
                return;
            }
        }
        // כפתור עלייה
        if (tx >= 20 && tx <= 100 && ty >= 276 && ty <= 296) {
            if (recipeScrollOffset > 0) {
                recipeScrollOffset--;
                ui_drawCurrentScreen();
            }
            return;
        }
        // כפתור ירידה
        if (tx >= 140 && tx <= 220 && ty >= 276 && ty <= 296) {
            if (recipeScrollOffset + VISIBLE < recipeListCount) {
                recipeScrollOffset++;
                ui_drawCurrentScreen();
            }
            return;
        }
        // כפתור Back
        if (ty >= 298 && ty <= 320) {
            ui_setScreen(SCREEN_HOME);
            return;
        }
    }

    // מסך STOP: Continue / Skip / Cancel
    if (currentScreen == SCREEN_STOP) {
        // Continue (y=105-160)
        if (ty >= 105 && ty <= 160) {
            comm_sendResumeCommand();
            ui_setScreen(SCREEN_RUNNING);
            exec_startCurrentStep();
            delay(200);
            return;
        }
        // Skip (y=170-225)
        if (ty >= 170 && ty <= 225) {
            ui_setScreen(SCREEN_RUNNING);
            exec_onDone();
            delay(200);
            return;
        }
        // Cancel (y=235-290)
        if (ty >= 235 && ty <= 290) {
            comm_sendStopCommand();
            ui_setScreen(SCREEN_HOME);
            return;
        }
    }

    // מסך SUCCESS: לחיצה על כפתור "בית"
    if (currentScreen == SCREEN_SUCCESS) {
        if (tx >= 60 && tx <= 180 && ty >= 220 && ty <= 270) {
            ui_setScreen(SCREEN_HOME);
        }
    }

    // מסך INSTRUCTION: לחיצה על כפתור "Continue" → עוברים לשלב הבא
    if (currentScreen == SCREEN_INSTRUCTION) {
        if (tx >= 60 && tx <= 180 && ty >= 250 && ty <= 300) {
            ui_setScreen(SCREEN_RUNNING);
            exec_onDone();
            delay(200);
        }
    }
}
