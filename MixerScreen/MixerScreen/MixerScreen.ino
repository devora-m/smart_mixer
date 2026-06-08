#include "Config.h"
#include "Communication.h"
#include "UI.h"
#include "WiFiManager.h"
#include "HttpClient.h"

void setup() {
    // אתחול התקשורת למחשב (לצורך דיבוג בסיראל מוניטור)
    Serial.begin(115200);
    delay(300);
    Serial.println("\n=== Smart Mixer Screen (UART Version) ===");

    // 1. חיבור WiFi (חוסם עד 10 שניות, ממשיך בלי WiFi אם נכשל)
    wifi_init();

    // 2. אתחול התקשורת מול הבקר הראשי (JSON דרך Serial2)
    comm_init();

    // 3. אתחול מסך המגע
    ui_init();

    // 4. בדיקת שליפת מתכונים מהשרת (זמנית — לצורך אימות בלבד)
    String recipesJson;
    if (http_fetchRecipes(recipesJson)) {
        Serial.println("[HTTP] First 200 chars: " + recipesJson.substring(0, 200));
    }

    // 5. ציור מסך הבית
    ui_setScreen(SCREEN_HOME);
}

void loop() {
    // 1. קריאת ופענוח הודעות חדשות מהבקר הראשי (משקל וסטטוס)
    comm_pumpMessages();

    // 2. זיהוי לחיצות מגע של המשתמש והפעלת הכפתורים
    ui_pumpTouch();
}