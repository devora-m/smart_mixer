#pragma once
#include <Arduino.h>

// =====================================================
//  HttpClient — שליפת מתכונים מהשרת דרך HTTP
//
//  דורש:
//    • חיבור WiFi פעיל (wifi_isConnected() == true)
//    • שרת פועל בכתובת SERVER_BASE_URL שב-credentials.h
// =====================================================

// מושך את כל המתכונים מ-GET /api/recipes
// מאחסן את גוף התגובה (JSON) ב-outJson
// מחזיר: true אם הצליח (HTTP 200), false בכל כשל
bool http_fetchRecipes(String &outJson);

// מושך מתכון בודד לפי קוד מספרי מ-GET /api/recipes/by-code/:code
// מחזיר: true אם הצליח (HTTP 200), false בכל כשל
bool http_fetchRecipeByCode(int code, String &outJson);
