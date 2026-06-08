// ultra-sonic.ino
#include "Config.h"
#include "States.h"

void initUltrasonic() {
  pinMode(ULTRA_TRIG_PIN, OUTPUT); 
  pinMode(ULTRA_ECHO_PIN, INPUT);
}

int getDistance() {
    digitalWrite(ULTRA_TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(ULTRA_TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(ULTRA_TRIG_PIN, LOW);
    long duration = pulseIn(ULTRA_ECHO_PIN, HIGH, 30000UL);   
    return (int)(duration * 0.034 / 2);
}

void updateDistance() {
    distance = getDistance();
}

bool isDistanceUp() {
    float currentReading = getDistance();
    if (currentReading > distance) {
        return true;
    }
    return false;
}

bool checkDistanceChange(int height) {
    int expectedDistance = distance - height;
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint >= 200) {
        Serial.print("Current: ");   Serial.print(getDistance());
        Serial.print(" | Target: "); Serial.print(expectedDistance);
        Serial.print(" | Diff: ");   Serial.println(abs(getDistance() - expectedDistance));
        lastPrint = millis();
    }
    return abs(getDistance() - expectedDistance) <= 1;
}