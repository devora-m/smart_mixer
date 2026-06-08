#pragma once

// תואם ל-STEP_TYPES  בשרת
struct RecipeStep {
    char type[20];       // "ADD_INGREDIENTS", "MIX", וכו'
    float targetWeight;
    int motorSpeed;
    int durationSec;
};

struct Recipe {
    int id;              // הקוד שהמשתמש מקליד
    char name[32];
    int stepCount;
    RecipeStep steps[5]; // נגביל ל-5 שלבים לכל מתכון בשביל הזיכרון (אפשר להגדיל)
};