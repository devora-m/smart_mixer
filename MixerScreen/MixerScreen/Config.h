#pragma once
#include <stdint.h>
#include "credentials.h"  // WiFi + Server — לא עולה לגיט

// =====================================================
//  UART Communication
// =====================================================
// הגדרת הפינים של המסך שיתחברו לבקר הראשי
// (כברירת מחדל נשתמש ב-Serial2 של ה-ESP32)
#define UART_RX_PIN 16
#define UART_TX_PIN 17
#define UART_BAUD_RATE 115200

// =====================================================
//  Touch Calibration
// =====================================================
// נתוני הכיול מהקובץ הישן שלך - ללא שינוי
static const uint16_t TOUCH_CAL_DATA[5] = { 256, 3514, 364, 3559, 4 };

// =====================================================
//  Display
// =====================================================
// 0 = portrait, plug at top
// 1 = landscape, plug at right
// 2 = portrait, plug at bottom
// 3 = landscape, plug at left
#define SCREEN_ROTATION 0
#define SCREEN_WIDTH    240
#define SCREEN_HEIGHT   320