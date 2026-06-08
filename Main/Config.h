// Config.h
#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// === הגדרות פינים עבור המנוע (DC.ino) ===
#define MOTOR_IN1_PIN    26  // פין כיוון 1 וערוץ PWM ראשון
#define MOTOR_IN2_PIN    27  // פין כיוון 2 וערוץ PWM שני
const int MOTOR_PWM_CHANNEL1 = 0;
const int MOTOR_PWM_CHANNEL2 = 1;
const int MOTOR_FREQ = 5000;
const int MOTOR_RESOLUTION = 8;    // רזולוציה של 8 ביט (0-255)

// === הגדרות פינים עבור חיישן המשקל (loadCell.ino) ===
#define SCALE_DOUT_PIN   4   // פין נתונים של המשקל
#define SCALE_SCK_PIN    5   // פין שעון של המשקל
const float CALIBRATION_FACTOR = 210.38; // ערך כיול מדוד מהקוד שלך

// === הגדרות פינים עבור חיישן המרחק האולטרסוני (ultra-sonic.ino) ===
#define ULTRA_TRIG_PIN   32  // פין טריגר לחיישן מרחק
#define ULTRA_ECHO_PIN   35  // פין אקו לחיישן מרחק

// === הגדרות פינים עבור חיישן הבטיחות (PIR.ino) ===
#define PIR_SAFETY_PIN   34  // פין קריאת חיישן חום הגוף/תנועה

// === הגדרות פינים עבור הרמקול (MP3.ino) ===
#define DFPLAYER_RX_PIN  16  // מתחבר ל-TX של רכיב ה-MP3
#define DFPLAYER_TX_PIN  17  // מתחבר ל-RX של רכיב ה-MP3

// === הגדרות פינים עבור הלדים (LED.ino) ===
#define LED_STRIP_PIN    22  // פין הנתונים של פס הלדים
#define LED_COUNT        14  // מספר הלדים שיש לך בפס

// === הגדרות פינים עבור כפתור עצירה פיזי (button.ino) ===
#define BUTTON_PIN       14  // פין הלחצן

// === הגדרות פינים עבור מקלדת המטריצה (keypad.ino) ===
const byte ROWS = 4; 
const byte COLS = 4;
// מערך הפינים המדויק מהקוד שלך
// const byte rowPins[ROWS] = {13, 12, 15, 2}; 
// const byte colPins[COLS] = {33, 23, 18, 19}; 

#endif