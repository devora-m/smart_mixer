#pragma once

// מאתחל חיבור WiFi לפי הנתונים ב-credentials.h
// חוסם עד 10 שניות — אם לא הצליח, ממשיך בלי WiFi
void wifi_init();

// מחזיר true אם יש חיבור WiFi פעיל
bool wifi_isConnected();
