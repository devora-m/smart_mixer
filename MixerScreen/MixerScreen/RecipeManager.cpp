#include "RecipeData.h"
#include <Arduino.h>

// בסיס הנתונים המקומי שלנו
const Recipe internalDatabase[] = {
    {
        101, "עוגה בחושה", 2, 
        {
            {"ADD_INGREDIENTS", 500.0, 0, 0},
            {"MIX", 0.0, 150, 120}
        }
    },
    {
        102, "קצפת", 1,
        {
            {"WHIP", 0.0, 250, 300}
        }
    }
};

const int databaseSize = 2;

// פונקציית שליפה
Recipe getRecipeById(int id) {
    for (int i = 0; i < databaseSize; i++) {
        if (internalDatabase[i].id == id) {
            return internalDatabase[i];
        }
    }
    Recipe empty = {0, "Not Found", 0, {}};
    return empty;
}