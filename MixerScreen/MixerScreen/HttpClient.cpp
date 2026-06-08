#include "HttpClient.h"
#include "Config.h"
#include "WiFiManager.h"
#include <HTTPClient.h>

// =====================================================
//  קבועים
// =====================================================
#define HTTP_TIMEOUT_MS   8000   // זמן המתנה מקסימלי לתגובה מהשרת
#define HTTP_MAX_BYTES    32768  // מגבלת גודל תגובה — 32KB מספיק לעשרות מתכונים

// =====================================================
//  פונקציה פנימית — מבצעת GET ומאחסנת תגובה ב-outJson
//  url   — כתובת מלאה
//  label — תווית לצורך הדפסת לוג בלבד
// =====================================================
static bool doGet(const String &url, const String &label, String &outJson) {
    // בדיקה שיש WiFi לפני כל ניסיון
    if (!wifi_isConnected()) {
        Serial.println("[HTTP] No WiFi — skipping " + label);
        return false;
    }

    HTTPClient http;

    // פתיחת החיבור עם timeout מוגדר
    http.begin(url);
    http.setTimeout(HTTP_TIMEOUT_MS);

    Serial.println("[HTTP] GET " + url);

    int statusCode = http.GET();

    if (statusCode != HTTP_CODE_OK) {
        // שגיאת שרת, timeout, או שהשרת לא זמין
        Serial.printf("[HTTP] %s failed — code: %d\n", label.c_str(), statusCode);
        http.end();
        return false;
    }

    // בדיקת גודל תגובה לפני קריאה (מניעת OOM על ESP32)
    int contentLength = http.getSize();
    if (contentLength > HTTP_MAX_BYTES) {
        Serial.printf("[HTTP] %s response too large (%d bytes)\n", label.c_str(), contentLength);
        http.end();
        return false;
    }

    // קריאת גוף התגובה לתוך String
    outJson = http.getString();
    http.end();

    Serial.printf("[HTTP] %s OK — %d bytes received\n", label.c_str(), outJson.length());
    return true;
}

// =====================================================
//  ממשק ציבורי
// =====================================================

bool http_fetchRecipes(String &outJson) {
    // שליפת כל המתכונים האישיים
    String url = String(SERVER_BASE_URL) + "/api/recipes";
    return doGet(url, "fetchRecipes", outJson);
}

bool http_fetchRecipeByCode(int code, String &outJson) {
    // שליפת מתכון בודד לפי קוד — שימושי בעתיד לזיהוי מהיר
    String url = String(SERVER_BASE_URL) + "/api/recipes/by-code/" + String(code);
    return doGet(url, "fetchRecipeByCode(" + String(code) + ")", outJson);
}
