#pragma once
#include <stdint.h>
#include "builtin_recipes.h" 

enum ScreenType {
    SCREEN_HOME,
    SCREEN_BUILTIN_LIST,
    SCREEN_CODE_INPUT,
    SCREEN_SERVINGS_INPUT,
    SCREEN_RECIPE_LIST,
    SCREEN_RUNNING,
    SCREEN_STOP,        // עצירת חירום: 3 כפתורים Continue/Skip/Cancel
    SCREEN_INSTRUCTION,   // הצגת הוראת ביניים עם כפתור "המשך"
    SCREEN_SUCCESS
};

void ui_init();
void ui_setScreen(ScreenType s);
void ui_drawCurrentScreen();
void ui_pumpTouch();
void ui_setWeight(float grams);
void ui_setStatus(const char* text);
void ui_handleKeypadInput(char key);
void ui_showInstruction(const char* text);  // מציג מסך INSTRUCTION עם טקסט
void ui_showStopScreen(const char* stateAtStop); // מציג מסך STOP עם 3 כפתורים
void ui_showRecipeList(const BuiltinRecipe** items, int count); // מציג מסך עם רשימת מתכונים לבחירה 

// הגדר מתכון שנבחר לפני מסך המנות (מתמלא על ידי RecipeExecutor)
void ui_setPendingRecipeCode(int code, bool isBuiltin);
