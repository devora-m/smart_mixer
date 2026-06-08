// loadCell.ino
#include "HX711.h"
#include "Config.h"
#include "States.h"

HX711 scale;

void initLoadCell() {
  scale.begin(SCALE_DOUT_PIN, SCALE_SCK_PIN);
  // שימוש ב-if במקום while למניעת תקיעה קשיחה
  while (!scale.is_ready()); 
  Serial.println("משקל מוכן");
    scale.set_scale(CALIBRATION_FACTOR);
    scale.tare();

}

bool isWeightUp(float requiredAmount = 20.0) {
    float weight = scale.get_units(5);
    
    // הגנה מפני קריאות שגויות (אם החיישן החזיר 0 או שגיאה)
    if (weight <= 0) return false; 
    
    // בדיקה האם המשקל הנוכחי גבוה ממשקל הבסיס הגלובלי בתוספת גרמים המטרה
    if (weight >= (currentWeight + requiredAmount)) {
        return true;
    }
    return false;
}
void updateWeight() {
  currentWeight = scale.get_units(5);
}

bool checkWeightChange(float newWeight) {
    float weight = scale.get_units(5);
    float expectedWeight = currentWeight + newWeight;
    return weight >= expectedWeight * 0.8 && weight <= expectedWeight * 1.2;
}