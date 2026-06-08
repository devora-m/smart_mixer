#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include "Protocol.h"

// =====================================================
//  Communication API (UART)
// =====================================================

// פונקציה לאתחול התקשורת הטורית (נקראת פעם אחת ב-setup)
void comm_init();

// פונקציה לקריאה ופענוח של הודעות נכנסות מהבקר הראשי
void comm_pumpMessages();

// =====================================================
//  Send Helpers (פונקציות לשליחת פקודות לבקר הראשי)
// =====================================================

// 1. שלב הוספת חומר בלבד (ללא מנוע)
// amountFolder/Record = הקלטת הכמות, unitFolder/Record = הקלטת הכלי, ingFolder/Record = הקלטת החומר
void comm_sendAddCommand(int amountFolder, int amountRecord,
                         int unitFolder,   int unitRecord,
                         int ingFolder,    int ingRecord,
                         float targetWeight);

// 2. שלב ערבוב בלבד
// ( ערכי ברירת מחדל 0 לקבצי הקול, למקרה שלא רוצים להשמיע כלום)
void comm_sendMixCommand(int speed, int durationSec, int folderNum = 0, int recordNum = 0);

// 3. שלב הקצפה בלבד (עד גובה יעד)
void comm_sendWhipCommand(int speed, float targetDistance, int folderNum = 0, int recordNum = 0);

// 4. שלב משולב: ערבוב והוספה
void comm_sendMixAddCommand(int speed, int folderNum, int recordNum, float targetWeight, int durationSec);

// 5. שלב משולב: הקצפה והוספה
void comm_sendWhipAddCommand(int speed, float targetDistance, int folderNum, int recordNum, float targetWeight, int durationSec);

// 6. פקודת מעבר למצב בחירת קוד מתכון
void comm_sendSelectCodeCommand();

// 7. פקודת עצירת חירום / ביטול פעולה
void comm_sendStopCommand();

// 8. פקודת המשכה — הפעל מחדש מנוע וחזור למצב הקודם
void comm_sendResumeCommand();