// DC.ino
#include "Config.h"
#include "States.h"

void initDC() {
  // הגדרת ערוצי ה-PWM לפינים מתוך Config.h
  ledcSetup(MOTOR_PWM_CHANNEL1, MOTOR_FREQ, MOTOR_RESOLUTION);
  ledcSetup(MOTOR_PWM_CHANNEL2, MOTOR_FREQ, MOTOR_RESOLUTION);
  ledcAttachPin(MOTOR_IN1_PIN, MOTOR_PWM_CHANNEL1);
  ledcAttachPin(MOTOR_IN2_PIN, MOTOR_PWM_CHANNEL2);
}

void stopMotor() {
  ledcWrite(MOTOR_PWM_CHANNEL1, 0);
  ledcWrite(MOTOR_PWM_CHANNEL2, 0);
}

void runMotor(int speed) {
  ledcWrite(MOTOR_PWM_CHANNEL1, speed);
  ledcWrite(MOTOR_PWM_CHANNEL2, 0);
}

void runMotorToDistance(int speed, int distance) {
  // הפעלת המנוע
  ledcWrite(MOTOR_PWM_CHANNEL1, speed);
  ledcWrite(MOTOR_PWM_CHANNEL2, 0);

  // בדיקה אם הגיע למרחק הרצוי בעזרת הפונקציה המקורית שלך
  if (checkDistanceChange(distance)) {
      Serial.println("הקצף הגיע לגובה, עוצר מנוע---");
      stopMotor();
  }
  else {
    Serial.println("עדיין לא הגיע לגובה...");
  }
}

void runMotorForTime(int speed, int durationMs) {
  static unsigned long motorStartTime = 0;
  static bool isTimerRunning = false;

  if (!isTimerRunning) {
    motorStartTime = millis();
    isTimerRunning = true;
  }

  ledcWrite(MOTOR_PWM_CHANNEL1, speed);
  ledcWrite(MOTOR_PWM_CHANNEL2, 0);

  // בדיקת זמן לא חוסמת
  if (millis() - motorStartTime >= (unsigned long)durationMs) {
    stopMotor();
    isTimerRunning = false; // איפוס הטיימר לפעם הבאה
  }
}