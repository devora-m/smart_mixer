#include "WiFiManager.h"
#include "Config.h"
#include <WiFi.h>

#define WIFI_TIMEOUT_MS   10000   // מקסימום 10 שניות לחיבור
#define WIFI_RETRY_DELAY  500     // בדיקה כל 500ms

void wifi_init() {
    Serial.println("[WiFi] Connecting to: " WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - start >= WIFI_TIMEOUT_MS) {
            Serial.println("[WiFi] FAILED — timeout. Continuing without WiFi.");
            return;
        }
        delay(WIFI_RETRY_DELAY);
        Serial.print(".");
    }

    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
}

bool wifi_isConnected() {
    return WiFi.status() == WL_CONNECTED;
}
