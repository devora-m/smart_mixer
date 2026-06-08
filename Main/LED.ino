//לד
#include <Adafruit_NeoPixel.h>


Adafruit_NeoPixel pixels(LED_COUNT, LED_STRIP_PIN, NEO_GRB + NEO_KHZ800);
void initLED() {
  pixels.begin();
  pixels.clear();
  pixels.show();
}
// צבע כל ה-LED – r,g,b בין 0 ל-255
void setAllLEDs(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < LED_COUNT; i++) {
    // Serial.println("נדלק לד");
    pixels.setPixelColor(i, pixels.Color(r, g, b));
  }
  pixels.show();
}
void randomLEDs() {
  // משתנים סטטיים שזוכרים את הזמן האחרון ואת מצב הלדים
  static unsigned long lastChangeTime = 0;
  unsigned long currentMillis = millis();
  
  // בדיקה אם עברה שנייה 
  if (currentMillis - lastChangeTime >= 1000) {
    // הגרלת ערכים חדשים
    uint8_t r = random(0, 256);
    uint8_t g = random(0, 256);
    uint8_t b = random(0, 256);
    
    // הפעלת הפונקציה 
    setAllLEDs(r, g, b);
    
    // עדכון זמן השינוי האחרון
    lastChangeTime = currentMillis;
  }
}
void showRainbowLED() {
    static int  shift = 0;
    static unsigned long lastMove = 0;
    if (millis() - lastMove >= 50) {
        shift = (shift + 1) % 3;
        lastMove = millis();
    }
    for (int i = 0; i < LED_COUNT; i++) {
        int colorIndex = (i + shift) % 3;
        if (colorIndex == 0)      
            pixels.setPixelColor(i, pixels.Color(255, 0, 0));
        else if (colorIndex == 1)   
            pixels.setPixelColor(i, pixels.Color(0, 255, 0));
        else                     
           pixels.setPixelColor(i, pixels.Color(0, 0, 255));
    }
    pixels.show();
}
void clearLEDs() {
  pixels.clear();
  pixels.show();
}

