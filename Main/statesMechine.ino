struct MixStateData
{
    bool active;
    unsigned long startTime;
};

MixStateData mixData = {false, 0};

struct FoamData {
    bool active;
};

FoamData foamData = {false};

//  ניהול התראת תנועה — אדום לשנייה וחצי בלבד

static unsigned long motionAlertStart = 0;
static bool motionAlertActive = false;

bool handleMotionAlert() {
    if (checkMotion()) {
        if (!motionAlertActive) {
            motionAlertActive = true;
            motionAlertStart = millis();
        }
        if (millis() - motionAlertStart < 1500) {
            setAllLEDs(255, 0, 0);
            return true;
        } else {
            motionAlertActive = false;
        }
    } else {
        motionAlertActive = false;
    }
    return false;
}

void handleCodeSelection() {
    // 1. הגנה ובטיחות: מוודאים שהמנוע כבוי לחלוטין בזמן הקשת קוד
    stopMotor(); 
    
    // 2. קריאת המקלדת שלך (keypad.ino)
    char pressedKey = loopKeypad(); 
    
    // 3. אם המשתמש לחץ על מקש כלשהו
    if (pressedKey != '-') {
        // אנחנו רוצים לוודא שזו אכן ספרה (בין '0' ל-'9') או תו רלוונטי
        Serial.print("קוד נבחר במקלדת: ");
        Serial.println(pressedKey);
        
        // 4. שליחת התו שנלחץ למסך בצורה מסודרת
        // נשתמש בפונקציה מתוך קובץ התקשורת כדי לעדכן את המסך על הלחיצה
        sendKeypadStrokeToScreen(pressedKey); 
        
        // 5. לאחר שליחת הספרה, נחזיר את הבקר למצב המתנה (IDLE) 
        // ונחכה שהמסך יגיד לנו מה השלב הבא שצריך לבצע בעקבות הקוד הזה.
        currentState = STATE_IDLE; 
    }
}
 void handleAddIngredient() {
    // משתנה סטטי לשמירת תת-המצב הפנימי של השקילה
    static int subState1 = 0; 
    
    switch (subState1) {
        case 0: { // שלב א': השמעת כמות + כלי + חומר ברצף ללא חסימה
            static int audioPhase = 0;
            static unsigned long audioTimer = 0;

            if (audioPhase == 0) {
                updateDistance();
                playTrack(currentCommand.amountFolder, currentCommand.amountRecord);
                Serial.println("משמיע: כמות");
                audioTimer = millis();
                audioPhase = 1;
            } else if (audioPhase == 1 && millis() - audioTimer >= 1500) {
                playTrack(currentCommand.unitFolder, currentCommand.unitRecord);
                Serial.println("משמיע: כלי");
                audioTimer = millis();
                audioPhase = 2;
            } else if (audioPhase == 2 && millis() - audioTimer >= 1500) {
                playTrack(currentCommand.ingFolder, currentCommand.ingRecord);
                Serial.println("משמיע: חומר");
                audioTimer = millis();
                audioPhase = 3;
            } else if (audioPhase == 3 && millis() - audioTimer >= 1500) {
                audioPhase = 0; // איפוס לפעם הבאה
                subState1 = 1;
            }
            break;
        }
            
        case 1: // שלב ב': המתנה שחיישן המרחק יזהה כניסה של חומר/יד
            if (isDistanceUp()) { 
                Serial.println("השתנה מרחק - החומר מתחיל להיכנס!");
                subState1 = 2; // מעבר לשלב השקילה האקטיבי
            }
            else {
                // הדפסת המרחק הנוכחי בסיראל למחשב לצורכי מעקב ודיבוג
                Serial.print("ממתין לזיהוי מרחק, ערך נוכחי: ");
                Serial.println(getDistance());
            }
            break;
            
        case 2: // שלב ג': המתנה עד שהמשקל יגיע לטווח היעד
            // שליחת עדכון מחזורי לא חוסם למסך כדי שהמשתמש יראה את המשקל עולה בלייב
            static unsigned long lastScreenUpdate = 0;
            if (millis() - lastScreenUpdate >= 250) {
                // קריאת יחידות מהירה לצורך השליחה למסך
                float liveWeight = scale.get_units(5); 
                sendStatusToScreen("RUNNING", liveWeight, 0);
                Serial.print("משקל נוכחי: ");
                Serial.print(liveWeight);
                Serial.print(" | משקל מצופה: ");
                Serial.println(currentWeight + currentCommand.targetWeight);
                lastScreenUpdate = millis();
            }
            // שימוש בפונקציה המדויקת שלך לאימות הגעה למשקל היעד!
            // מעבירים לה את currentCommand.targetWeight שזה משקל הרכיב שהתקבל מהמסך
            if (checkWeightChange(currentCommand.targetWeight)) {
                Serial.println("המשקל עלה והגיע לטווח היעד בהצלחה!");
                updateWeight(); 
                subState1 = 0;
                // שולחים DONE ישירות וחוזרים ל-IDLE — המסך ידאג להמשך
                sendStatusToScreen("DONE", currentWeight, 0);
                currentState = STATE_IDLE; 
            }
            else {
                // הדפסת המשקל הגולמי הנוכחי בסיראל של המחשב לדיבוג
                Serial.print("ממתין להגעה למשקל, ערך נוכחי: ");
                Serial.println(scale.get_units(5));
            }
            break;
    }
}

void handleMix() {
    static bool isMixActive = false;
    static unsigned long mixStartTime = 0;
    
    // 1. אתחול בריצה הראשונה של המצב
    if (!isMixActive) {
        mixStartTime = millis();
        Serial.println("--- התחלת מצב ערבוב מנוע ---");
        
        runMotor(currentCommand.motorSpeed); // הפעלת המנוע במהירות שהגיעה מהמסך
        isMixActive = true;
    }
    
    // 2. ניהול בטיחות, לדים ודיווח למסך בזמן אמת
    // if (motionDetected) {
        // 
        // שליחת עדכון דחוף למסך שמציין מצב אזהרה (WARNING) אך המנוע עדיין רץ
        // static unsigned long lastWarnScreenUpdate = 0;
        // if (millis() - lastWarnScreenUpdate >= 250) {
            // unsigned long elapsed = millis() - mixStartTime;
            // unsigned long durationMs = currentCommand.duration * 1000;
            // long timeLeftSec = (durationMs > elapsed) ? (durationMs - elapsed) / 1000 : 0;
            // 
            // שולחים סטטוס "WARNING" במקום "RUNNING" כדי שהמסך יציג פופ-אפ אזהרה
            // sendStatusToScreen("WARNING", currentWeight, timeLeftSec); 
            // lastWarnScreenUpdate = millis();
        // }
    // } 
     bool motionDetected = handleMotionAlert();
        if(!motionDetected) {
        // אם הכל תקין ואין אף אחד קרוב - ממשיכים עם אפקט קשת בענן הצבעוני 
        showRainbowLED(); }
        
        // שליחת עדכון שוטף רגיל למסך (RUNNING)
        static unsigned long lastNormalScreenUpdate = 0;
        if (millis() - lastNormalScreenUpdate >= 500) {
            unsigned long elapsed = millis() - mixStartTime;
            unsigned long durationMs = currentCommand.duration * 1000;
            long timeLeftSec = (durationMs > elapsed) ? (durationMs - elapsed) / 1000 : 0;
            
            sendStatusToScreen("RUNNING", currentWeight, timeLeftSec);
            lastNormalScreenUpdate = millis();
        }
    
    // 3. בדיקה אם זמן הערבוב הסתיים
    unsigned long durationMs = currentCommand.duration * 1000;
    unsigned long elapsed = millis() - mixStartTime;
    Serial.print("[MIX] עבר: "); Serial.print(elapsed/1000); Serial.print("s / ");
    Serial.print(currentCommand.duration); Serial.println("s");
    if (elapsed >= durationMs) {
        Serial.println("זמן הערבוב הסתיים בהצלחה!");
        
        stopMotor(); // עצירת המנוע בסיום הזמן
        clearLEDs(); // כיבוי הלדים
        
        isMixActive = false; // איפוס הדגל לפעמים הבאות
        currentState = STATE_SUCCESS_DONE; // מעבר למצב סיום מוצלח
    }
}

void handleWhipping() {
    // משתנים סטטיים לשמירת מצב ההקצפה הפנימי בין הריצות של ה-loop
    static bool isWhipActive = false;
    
    // 1. אתחול בריצה הראשונה של המצב
    if (!isWhipActive) {
        updateDistance(); // עדכון המרחק ההתחלתי באולטרסוניק (מתוך ultra-sonic.ino)
        Serial.println("עדכון מרחק התחלתי להקצפה");
        Serial.println("--- התחלת מצב הקצפה מנוע ---");
        
        runMotor(currentCommand.motorSpeed); // הפעלת המנוע במהירות שהגיעה מהמסך
        isWhipActive = true;
    }
    // 2. ניהול בטיחות, לדים ודיווח למסך בזמן אמת
    // if (motionDetected) {
        // שליחת אזהרה מחזורית למסך (פעם ב-250ms)
        // static unsigned long lastWarnUpdate = 0;
        // if (millis() - lastWarnUpdate >= 250) {
            // sendStatusToScreen("WARNING", currentWeight, 0); // שולחים WARNING למסך
            // lastWarnUpdate = millis();
        // }
    // } 
     bool motionDetected = handleMotionAlert();
     if(!motionDetected) {
    // אם הכל תקין ואין אף אחד קרוב - ממשיכים עם אפקט קשת בענן הצבעוני 
        showRainbowLED(); }
        // שליחת עדכון שוטף רגיל למסך (פעם ב-500ms)
        static unsigned long lastNormalUpdate = 0;
        if (millis() - lastNormalUpdate >= 500) {
            sendStatusToScreen("RUNNING", currentWeight, 0); // שולחים RUNNING למסך
            lastNormalUpdate = millis();
        }
    
    // 3. תנאי הסיום של ההקצפה - בדיקה אם הגענו לגובה הקצף הרצוי
    // מעבירים לפונקציה שלך את גובה הקצף המבוקש שהתקבל מהמסך
    if (checkDistanceChange(currentCommand.targetDistance)) {
        Serial.println("הגענו לגובה הקצף הרצוי - כיבוי מנוע והצלחה!");
        
        stopMotor(); // עצירת המנוע
        clearLEDs(); // כיבוי הלדים
        
        isWhipActive = false; // איפוס הדגל לפעמים הבאות
        currentState = STATE_SUCCESS_DONE; // מעבר למצב סיום מוצלח הראשי
    }
}

// הגדרת הדגל הגלובלי (צריך להוסיף אותו ב-States.h או בראש הטאב הראשי)

void handleMixAndAddState() {
    // 4 תתי-מצבים פנימיים לניהול רצף החומרים
    enum MixAddSubState {
        SUB_INIT_INGREDIENT,       // שלב 0: אתחול החומר הנוכחי ודגימת משקל בסיס
        SUB_WAIT_FOR_WEIGHT,       // שלב 1: המתנה לעליית משקל מהשפיכה
        SUB_WAIT_FOR_NEXT_COMMAND, // שלב 2: החומר הנוכחי הסתיים, המנוע רץ, מחכים לחומר הבא מהמסך
        SUB_FINAL_MIX_TIMER        // שלב 3: ערבוב סופי לפי זמן (עבור החומר האחרון)
    };
    
    static MixAddSubState subState = SUB_INIT_INGREDIENT;
    static unsigned long finalMixStartTime = 0;
    
    // אשכול בטיחות ולדים - רץ תמיד ברקע בכל תתי-המצבים
    // bool motionDetected = handleMotionAlert();
    // if (motionDetected) {
        // static unsigned long lastWarnUpdate = 0;
        // if (millis() - lastWarnUpdate >= 250) {
            // sendStatusToScreen("WARNING", currentWeight, 0);
            // lastWarnUpdate = millis();
        // }
    // } else {
      bool motionDetected = handleMotionAlert();
        if(!motionDetected) {
     // אם הכל תקין ואין אף אחד קרוב - ממשיכים עם אפקט קשת בענן הצבעוני 
         showRainbowLED(); }
    
    // ניהול תתי-המצבים
    switch (subState) {
        
        case SUB_INIT_INGREDIENT: {
            Serial.println("--- MIX_ADD: אתחול שלב חומר ---");
            static int mixAudioPhase = 0;
            static unsigned long mixAudioTimer = 0;

            // השמעת כמות + כלי + חומר ברצף ללא חסימה
            if (mixAudioPhase == 0) {
                runMotor(currentCommand.motorSpeed);
                updateWeight();
                Serial.print("משקל בסיס: "); Serial.println(currentWeight);
                playTrack(currentCommand.amountFolder, currentCommand.amountRecord);
                mixAudioTimer = millis(); mixAudioPhase = 1;
            } else if (mixAudioPhase == 1 && millis() - mixAudioTimer >= 1500) {
                playTrack(currentCommand.unitFolder, currentCommand.unitRecord);
                mixAudioTimer = millis(); mixAudioPhase = 2;
            } else if (mixAudioPhase == 2 && millis() - mixAudioTimer >= 1500) {
                playTrack(currentCommand.ingFolder, currentCommand.ingRecord);
                mixAudioTimer = millis(); mixAudioPhase = 3;
            } else if (mixAudioPhase == 3 && millis() - mixAudioTimer >= 1500) {
                mixAudioPhase = 0;
                newCommandArrived = false;
                subState = SUB_WAIT_FOR_WEIGHT;
            }
            break;
        }
            
        case SUB_WAIT_FOR_WEIGHT:
            // דיווח שוטף למסך ולמחשב
            if (!motionDetected) {
                static unsigned long lastNormalUpdate = 0;
                if (millis() - lastNormalUpdate >= 500) {
                    float liveWeight = scale.get_units(5);
                    sendStatusToScreen("RUNNING", liveWeight, 0);
                    
                    Serial.print("ממתין לחומר... משקל נוכחי: ");
                    Serial.print(liveWeight);
                    Serial.print(" | משקל יעד להפעלה: ");
                    Serial.println(currentWeight + 20.0); // מראה לך מתי זה יקפוץ שלב
                    
                    lastNormalUpdate = millis();
                }
            }
            
            // קריאה לפונקציה החדשה שלך מהטאב של המשקל! (עם סינון של 20 גרם)
            if (isWeightUp(20.0)) { 
                Serial.println("MIX_ADD: החומר הנוכחי זוהה ונשקל בהצלחה!");
                updateWeight(); // עדכון המשקל הגלובלי החדש
                Serial.println(currentWeight);
                
                // בדיקה: האם זה החומר האחרון ויש לו זמן ערבוב סופי?
                if (currentCommand.duration > 0) {
                    Serial.println("MIX_ADD: עובר לשלב טיימר ערבוב סופי...");
                    finalMixStartTime = millis();
                    subState = SUB_FINAL_MIX_TIMER;
                } else {
                    Serial.println("MIX_ADD: מודיע למסך וממתין לחומר הבא ברצף.");
                    sendStatusToScreen("DONE", currentWeight, 0);
                    subState = SUB_WAIT_FOR_NEXT_COMMAND;
                }
            }
            break;
            
        case SUB_WAIT_FOR_NEXT_COMMAND:
            // המנוע ממשיך להסתובב ברקע במהירות האחרונה שהוגדרה!
            runMotor(currentCommand.motorSpeed);
            
            // בדיקה האם המסך שלח חומר חדש והדגל נדלק
            if (newCommandArrived == true) {
                Serial.println("MIX_ADD: התקבלה פקודת חומר חדשה מהמסך ברצף!");
                subState = SUB_INIT_INGREDIENT; // חוזרים לאתחל את החומר הבא
            }
            break;
            
        case SUB_FINAL_MIX_TIMER:
            unsigned long elapsed = millis() - finalMixStartTime;
            unsigned long durationMs = currentCommand.duration * 1000;
            
            if (!motionDetected) {
                static unsigned long lastTimerUpdate = 0;
                if (millis() - lastTimerUpdate >= 500) {
                    long timeLeftSec = (durationMs > elapsed) ? (durationMs - elapsed) / 1000 : 0;
                    sendStatusToScreen("RUNNING", currentWeight, timeLeftSec);
                    lastTimerUpdate = millis();
                }
            }
            
            // בדיקה אם זמן הערבוב הסופי של המתכון תם
            if (elapsed >= durationMs) {
                Serial.println("MIX_ADD: כל השלבים המשולבים והטיימר הסתיימו בהצלחה!");
                stopMotor(); // רק עכשיו, בסוף הכל, מכבים את המנוע
                clearLEDs();
                
                subState = SUB_INIT_INGREDIENT; // איפוס תת-המצב לפעמים הבאות
                currentState = STATE_SUCCESS_DONE; // מעבר למצב הצלחה ראשי
            }
            break;
    } // סגירת ה-switch
} // סגירת הפונקציה handleMixAndAddState


void handleWhipAndAddState() {
    // 5 תתי-מצבים פנימיים לניהול הרצף הייחודי הזה
    enum WhipAddSubState {
        SUB_START_WHIPPING,        // שלב 0: הפעלת מנוע ועדכון מרחק התחלתי
        SUB_WAIT_FOR_FOAM_HEIGHT,  // שלב 1: הקצפה בלבד והמתנה שהקצף יגיע לגובה (לפי מרחק)
        SUB_INIT_INGREDIENT,       // שלב 2: הקצף בגובה המבוקש! משמיעים קול ולוקחים משקל בסיס
        SUB_WAIT_FOR_WEIGHT,       // שלב 3: המתנה שהמשקל יעלה (הוספת החומר)
        SUB_WAIT_FOR_NEXT_COMMAND, // שלב 4: המתנה לחומר הבא מהמסך (המנוע ממשיך לעבוד ברצף)
        SUB_FINAL_TIMER            // שלב 5: ערבוב/הקצפה סופיים לפי זמן, ואז עצירה
    };
    
    static WhipAddSubState subState = SUB_START_WHIPPING;
    static unsigned long finalTimerStartTime = 0;
    static float baselineWeight = 0.0;
    
    // אשכול בטיחות ולדים - רץ תמיד ברקע בכל תתי-המצבים (לדים אדומים בתנועה, קשת בענן כשתקין)
    // bool motionDetected = handleMotionAlert();
    // if (motionDetected) {
        // static unsigned long lastWarnUpdate = 0;
        // if (millis() - lastWarnUpdate >= 250) {
            // sendStatusToScreen("WARNING", currentWeight, 0);
            // lastWarnUpdate = millis();
        // }
    bool motionDetected = handleMotionAlert();
      if(!motionDetected) {
   // אם הכל תקין ואין אף אחד קרוב - ממשיכים עם אפקט קשת בענן הצבעוני 
       showRainbowLED(); }
    // ניהול תתי-המצבים
    switch (subState) {
        
        case SUB_START_WHIPPING:
            Serial.println("--- WHIP_ADD: מתחיל שלב הקצפה ראשוני ---");
            runMotor(currentCommand.motorSpeed); // הפעלת המנוע במהירות ההקצפה
            updateDistance(); // עדכון המרחק ההתחלתי באולטרסוניק
            
            newCommandArrived = false;
            subState = SUB_WAIT_FOR_FOAM_HEIGHT;
            break;
            
        case SUB_WAIT_FOR_FOAM_HEIGHT:
            // עדכון שוטף למסך שהבקר עובד ומקציף
            if (!motionDetected) {
                static unsigned long lastNormalUpdate = 0;
                if (millis() - lastNormalUpdate >= 500) {
                    sendStatusToScreen("RUNNING", currentWeight, 0);
                    lastNormalUpdate = millis();
                }
            }
            
            // בדיקה באמצעות הפונקציה שלך האם הקצף עלה והגיע למרחק המבוקש מהחיישן
            if (checkDistanceChange(currentCommand.targetDistance)) {
                Serial.println("WHIP_ADD: הקצף הגיע לגובה המבוקש! עובר לשלב הוספת החומר.");
                subState = SUB_INIT_INGREDIENT; // הקצף מוכן, עוברים מיד להפעלת החומר
            }
            break;
            
        case SUB_INIT_INGREDIENT: {
            // שלב זה מופעל רק אחרי שחיישן המרחק נתן אישור!
            Serial.println("WHIP_ADD: מפעיל הנחייה קולית ולוקח משקל בסיס");
            static int whipAudioPhase = 0;
            static unsigned long whipAudioTimer = 0;

            if (whipAudioPhase == 0) {
                baselineWeight = scale.get_units(10);
                playTrack(currentCommand.amountFolder, currentCommand.amountRecord);
                whipAudioTimer = millis(); whipAudioPhase = 1;
            } else if (whipAudioPhase == 1 && millis() - whipAudioTimer >= 1500) {
                playTrack(currentCommand.unitFolder, currentCommand.unitRecord);
                whipAudioTimer = millis(); whipAudioPhase = 2;
            } else if (whipAudioPhase == 2 && millis() - whipAudioTimer >= 1500) {
                playTrack(currentCommand.ingFolder, currentCommand.ingRecord);
                whipAudioTimer = millis(); whipAudioPhase = 3;
            } else if (whipAudioPhase == 3 && millis() - whipAudioTimer >= 1500) {
                whipAudioPhase = 0;
                newCommandArrived = false;
                subState = SUB_WAIT_FOR_WEIGHT;
            }
            break;
        }
            
        case SUB_WAIT_FOR_WEIGHT:
            // המתנה אקטיבית שהמשקל יעלה ב-20 גרם לפחות מעל משקל הבסיס (סינון רעידות מנוע)
            if (scale.get_units(5) >= (baselineWeight + 20.0)) {
                Serial.println("WHIP_ADD: החומר הנוכחי נשקל בהצלחה!");
                updateWeight(); // עדכון משקל גלובלי יציב
                
                // בדיקה: האם זה החומר האחרון ויש לו זמן ערבוב/הקצפה סופי?
                if (currentCommand.duration > 0) {
                    Serial.println("WHIP_ADD: נמצא זמן סיום, עובר לשלב הטיימר...");
                    finalTimerStartTime = millis();
                    subState = SUB_FINAL_TIMER;
                } else {
                    // אם אין זמן, סימן שיש עוד חומרים ברצף שהמסך עומד לשלוח
                    Serial.println("WHIP_ADD: חומר הוכנס, מודיע למסך וממתין לחומר הבא.");
                    sendStatusToScreen("DONE", currentWeight, 0); // מודיע למסך שהשלב הנוכחי בוצע
                    subState = SUB_WAIT_FOR_NEXT_COMMAND; // עובר להמתין מבלי לעצור את המנוע
                }
            }
            break;
            
        case SUB_WAIT_FOR_NEXT_COMMAND:
            // המנוע ממשיך לעבוד ברצף, ומחכים שהדגל הגלובלי יידלק כשהמסך ישלח את ה-JSON הבא
            if (newCommandArrived == true) {
                Serial.println("WHIP_ADD: התקבלה פקודת חומר חדשה ברצף מהמסך!");
                // שימי לב: עבור החומרים הבאים ברצף, אנחנו לא צריכים לחכות שוב שהקצף יעלה! 
                // הקצף כבר למעלה, לכן אנחנו קופצים ישירות לשלב הפעלת הרמקול ושקילת החומר הבא:
                subState = SUB_INIT_INGREDIENT; 
            }
            break;
            
        case SUB_FINAL_TIMER:
            unsigned long elapsed = millis() - finalTimerStartTime;
            unsigned long durationMs = currentCommand.duration * 1000;
            
            // עדכון זמן לאחור על הצג של המסך
            if (!motionDetected) {
                static unsigned long lastTimerUpdate = 0;
                if (millis() - lastTimerUpdate >= 500) {
                    long timeLeftSec = (durationMs > elapsed) ? (durationMs - elapsed) / 1000 : 0;
                    sendStatusToScreen("RUNNING", currentWeight, timeLeftSec);
                    lastTimerUpdate = millis();
                }
            }
            
            // תנאי העצירה הסופי של המנוע - לפי הזמן שהתקבל מהמסך!
            if (elapsed >= durationMs) {
                Serial.println("WHIP_ADD: כל שלב ההקצפה וההוספה המשולב הסתיים בהצלחה!");
                stopMotor(); // עצירת המנוע הרשמית בסיום הזמן
                clearLEDs();
                
                subState = SUB_START_WHIPPING; // איפוס תת-המצב לפעמים הבאות
                currentState = STATE_SUCCESS_DONE; // מעבר למצב הצלחה ראשי
            }
            break;
    }
}
// void voiceAlert(int folderNum, int fileNum)
// {
//     playTrack(folderNum, fileNum);
// }

// void finish(int folderNum, int fileNum)
// {
//     playTrack(folderNum, fileNum);
//     setAllLEDs(255,255,255)//לבן
    
// }
void handleSuccessDoneState() {
    // משתנים סטטיים לשמירת זמן התחלת החגיגה ומצב האתחול
    static bool isSuccessInit = false;
    static unsigned long successStartTime = 0;
    
    // משך הזמן בשניות שהחיווי יפעל (למשל 3000 מילי-שניות = 3 שניות)
    const unsigned long displayDurationMs = 3000; 

    // 1. ריצה ראשונה (אתחול המצב) - קורה פעם אחת בלבד בכניסה לשלב
    if (!isSuccessInit) {
        successStartTime = millis();
        Serial.println("=========================================");
        Serial.println(">>> המערכת נכנסה למצב: סיום מוצלח (SUCCESS) <<<");
        Serial.println("=========================================");

        // א. חיווי ויזואלי: הדלקת כל הלדים בירוק עז (RGB: 0, 255, 0) מתוך LED.ino
        setAllLEDs(0, 255, 0); 
        // ג. עדכון סופי ומסכם למסך שהשלב הנוכחי בוצע לחלוטין ובמהירות
        // שולחים סטטוס "DONE", את המשקל הנוכחי בקערה, ו-0 שניות שנותרו
        sendStatusToScreen("DONE", currentWeight, 0);
        isSuccessInit = true; // מסמנים שהאתחול בוצע
    }

    // 2. ריצה מחזורית לא חוסמת - המתנה עד שיעברו 3 שניות
    if (millis() - successStartTime >= displayDurationMs) {
        Serial.println("חגיגת הסיום הסתיימה. מנקה חומרה וחוזר למצב המתנה (IDLE).");
        // א. כיבוי הלדים כדי לא לבזבז זרם ולא להשאיר אור דלוק קבוע
        clearLEDs(); 
        // ב. איפוס הדגל הסטטי כדי שהפונקציה תדע לפעול מחדש בשלב הבא של המתכון
        isSuccessInit = false; 
        // ג. העברת מכונת המצבים הראשית למצב המתנה - מוכן לפקודה הבאה מהמסך!
        currentState = STATE_IDLE; 
    }
}






