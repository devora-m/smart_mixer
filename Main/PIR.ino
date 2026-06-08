// PIR.ino
#include "Config.h"
#include "States.h"

int motionState = LOW;

void initPIR() {
  pinMode(PIR_SAFETY_PIN, INPUT);
  // ה-delay(30000) הוסר כדי למנוע השהיית מערכת ארוכה באתחול
}

bool checkMotion() {
    static bool          isActive  = false;
    static unsigned long startTime = 0;
    
    if (!isActive && digitalRead(PIR_SAFETY_PIN) == HIGH) {
        Serial.println("זוהתה תנועה...");
        startTime = millis();
        isActive  = true;
    }
    
    if (isActive && (millis() - startTime >= 3000)) {
        Serial.println("ההתראה הסתיימה");
        isActive = false;
    }
    
    return isActive;
}