#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>
#include "States.h"
#include "Protocol.h"

// ---- פיני UART (Serial1) מול המסך ----
#define SCREEN_RX_PIN 25
#define SCREEN_TX_PIN 21

// ---- אתחול ----
void initCommunication();

// ---- הודעות יוצאות (Main → Screen) ----

// שליחת עדכון משקל/סטטוס שוטף למסך
// statusType: STATUS_WEIGHT_UPDATE | STATUS_DONE
void sendStatusToScreen(const char* statusType, float weight, unsigned long timeLeftMs);

// שליחת לחיצת מקש מהמקלדת הפיזית למסך
void sendKeypadStrokeToScreen(char key);

// שליחת הודעת STOP למסך כאשר כפתור העצירה הפיזי נלחץ
// stateAtStop: המצב שבו הייתה המערכת ברגע העצירה
void sendStopToScreen(MixerState stateAtStop);

// ---- הודעות נכנסות (Screen → Main) ----

// קריאת הודעות JSON מהמסך ועדכון currentCommand + currentState
void checkIncomingSerial();