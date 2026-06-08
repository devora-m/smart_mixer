// ---- כפתור עצירה פיזי ----

void initButton() {
    pinMode(BUTTON_PIN, INPUT);
}

// נקראת בכל סיבוב loop.
// פועלת רק כאשר המנוע דלוק (מצבי STATE_MIXING/WHIPPING/MIX_AND_ADD/WHIP_AND_ADD).
// עוצרת את המנוע באופן מיידי, מעדכנת את המצב ל-STATE_EMERGENCY_STOP,
// ושולחת הודעת STOP למסך עם המצב שהיה פעיל לפני העצירה.
void checkStopButton() {
    // רק בזמן שהמנוע פועל — בשאר המצבים הכפתור לא רלוונטי
    bool motorActive = (currentState == STATE_MIXING    ||
                        currentState == STATE_WHIPPING  ||
                        currentState == STATE_MIX_AND_ADD ||
                        currentState == STATE_WHIP_AND_ADD);

    if (!motorActive) return;

    if (digitalRead(BUTTON_PIN) == HIGH) {
        previousState = currentState;         // שמירת המצב לפני העצירה
        stopMotor();                          // עצירה מיידית
        sendStopToScreen(currentState);       // הודעה למסך עם המצב לפני העצירה
        currentState = STATE_EMERGENCY_STOP;  // מצב המתנה עד להחלטת המשתמש במסך
    }
}
