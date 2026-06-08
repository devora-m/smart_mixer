// keypad.ino
#include <Keypad.h>
#include "Config.h"
#include "States.h"

// המערך והפינים המקוריים שלך נשמרים בדיוק כפי שהם
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte rowPins[ROWS] = {13, 12, 15, 2}; 
byte colPins[COLS] = {33, 23, 18, 19};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void initKeypad() {
}

char loopKeypad() {
  char key = keypad.getKey();
  if (key) {
    Serial.println(key);
    return key;
  }
  else
     return '-';
}