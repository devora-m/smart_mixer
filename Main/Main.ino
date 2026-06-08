// #include "Global.h";
// float currentWeight=0.0;
// float distance=0;

// State currentState;
// void handleAddIngredient(int folderNum, int fileNum, float weight);
// void setup()
// {
//     Serial.begin(115200);
//     initLED();
//     // initButton();
//     initPIR();
//     // initLoadCell();
//     initUltrasonic();
//     // initMP3();
//     initDC();

// }

// void loop()
// {
//     switch(currentState)
//     {
//         case CODE_SELECTION:
//             handleCodeSelection();
//             break;

//         case SELECT_RECIPE:
//             handleAddIngredient(01 , 001 , 70.00);
//             break;
            
//         case ADD_INGREDIENT:
//             // קוד הוספת רכיב
//             break;

//         case MIX:
//            handleMix(100,10000);
//             break;

//          case FOAMING:
//            handleFoaming(100,10);
//             break;

//         case MIX_AND_ADD:
//             // קוד ערבוב והוספה
//             break;

//         case EXTRA_MIX:
//             // קוד ערבוב נוסף
//             break;

//         case FINISHED:
//             // קוד סיום
//             break;
//     }
// }
#include "States.h"
#include "Config.h"
#include "Communication.h"

// ======================================================================
// הגדרת המשתנים הגלובליים (הקצאת זיכרון פיזית התואמת ל-extern בקבצים האחרים)
// ======================================================================
MixerState currentState  = STATE_IDLE; // מצב נוכחי
MixerState previousState = STATE_IDLE; // מצב לפני עצירת חירום (לשחזור אליו ב-RESUME)
StepCommand currentCommand;           // מבנה הפקודה הנוכחית
float currentWeight = 0.0;            // משקל הקערה (מתוך loadCell)
int distance = 0;                     // מרחק הקצף (מתוך ultra-sonic)
bool newCommandArrived = false;       // דגל שמסמן פקודה חדשה ברצף

// ======================================================================
// הצהרה על פונקציות הטיפול הקיימות בתוך statesMechine.ino
// ======================================================================
void handleCodeSelection();
void handleMixingState();
void handleWhippingState();
void handleMixAndAddState();
void handleWhipAndAddState();
void handleSuccessDoneState();

// הצהרה על פונקציות מקומיות בתוך המיין
void handleIdleState();
void handleEmergencyStopState();
void checkDebugInputs();

// הצהרות על פונקציות אתחול החומרה מהטאבים שלך (תואם לשמות ב-Config.h ובחיישנים)
void initLED();
void initPIR();
void initUltrasonic();
void initDC();
void initLoadCell(); // הסירי את סימני ההערה כשהחומרה מחוברת ומקודדת
void initMP3();      // הסירי את סימני ההערה כשהחומרה מחוברת ומקודדת
void checkStopButton(); // button.ino — בדיקת כפתור עצירה פיזי

// ======================================================================
// SETUP: אתחול תקשורת וחומרה
// ======================================================================
void setup() {
    // 1. אתחול הסיראל למסך (Serial1 פינים 25, 21) ולמחשב (Serial) מתוך Communication.h
    initCommunication();
    
    // 2. הפעלת פונקציות אתחול החומרה הקיימות בטאבים שלך
    initLED();         // אתחול לדים
    initPIR();         // אתחול חיישן בטיחות חום גוף
    initUltrasonic();  // אתחול חיישן מרחק אולטרסוני
    initDC();          // אתחול בקר מנוע
    
    initLoadCell(); 
    initMP3();      
    
    Serial.println("==================================================");
    Serial.println("   התאמת שמות הושלמה! הבקר מוכן להרצת בדיקות    ");
    Serial.println("==================================================");
    Serial.println("כל פקודות הקול מכוונות אך ורק לתיקייה 01 קובץ 001");
    Serial.println("==================================================");
    Serial.println("תפריט בדיקה (הקישי אות ושלחי בסיראל מוניטור):");
    Serial.println(" [i] -> מצב המתנה (STATE_IDLE)");
    Serial.println(" [c] -> מצב בחירת קוד במקלדת (STATE_CODE_SELECTION)");
    Serial.println(" [m] -> בדיקת מצב ערבוב בלבד (STATE_MIXING)");
    Serial.println(" [w] -> בדיקת מצב הקצפה בלבד (STATE_WHIPPING)");
    Serial.println(" [a] -> בדיקת מצב משולב ערבוב והוספה (STATE_MIX_AND_ADD)");
    Serial.println(" [q] -> בדיקת מצב משולב הקצפה והוספה (STATE_WHIP_AND_ADD)");
    Serial.println(" [e] -> בדיקת מצב עצירת חירום (STATE_EMERGENCY_STOP)");
    Serial.println(" [s] -> בדיקת חיווי סיום מוצלח (STATE_SUCCESS_DONE)");
    Serial.println("==================================================");
}

// ======================================================================
// LOOP: הלולאה הראשית של המערכת המנתבת לפי ה-enum המעודכן
// ======================================================================
void loop() {
    // 1. קריאה רציפה של פקודות JSON אמיתיות שמגיעות מהמסך (במידה ויש)
    checkIncomingSerial();

    // 2. בדיקת כפתור עצירה פיזי — פועל רק בזמן שהמנוע דלוק
    checkStopButton();

    // 3. קריאת פקודות בדיקה ידניות מהמחשב
    checkDebugInputs();
    
    switch(currentState) {
        case STATE_IDLE:
            handleIdleState();
            break;

        case STATE_CODE_SELECTION:
            handleCodeSelection();
            break;

        case STATE_ADD_INGREDIENT:    // <-- הוספת ה-Case שמפעיל את הפונקציה שלך!
            handleAddIngredient();
            break;

        case STATE_MIXING:
            handleMix();
            break;

        case STATE_WHIPPING:
            handleWhipping();
            break;

        case STATE_MIX_AND_ADD:
            handleMixAndAddState();
            break;

        case STATE_WHIP_AND_ADD:
            handleWhipAndAddState();
            break;

        case STATE_EMERGENCY_STOP:
            handleEmergencyStopState();
            // checkIncomingSerial() רץ בכל סיבוב ויעדכן את currentState כשתגיע פקודה חדשה מהמסך
            break;

        case STATE_SUCCESS_DONE:
            handleSuccessDoneState();
            break;
    }

}

// ======================================================================
// פונקציות הטיפול המקומיות במיין (IDLE, עצירת חירום ותפריט הבדיקה)
// ======================================================================

void handleIdleState() {
    static bool printedIdle = false;
    if (!printedIdle) {
        Serial.println(">>> סטטוס מערכת: STATE_IDLE. מנוע כבוי. ממתין לפקודה.");
        // stopMotor();  // לוודא מנוע כבוי
        printedIdle = true;
    }
    if (currentState != STATE_IDLE) {
        printedIdle = false;
    }
}

void handleEmergencyStopState() {
    static bool printedEmergency = false;
    if (!printedEmergency) {
        Serial.println("!!! אזעקה: STATE_EMERGENCY_STOP - חום גוף קרוב מדי, המנוע נעצר !!!");
        // stopMotor();  // עצירה מיידית פיזית של המנוע לבטיחות
        // setAllLEDs(255, 0, 0); // לדים באדום קבוע
        printedEmergency = true;
    }
    if (currentState != STATE_EMERGENCY_STOP) {
        printedEmergency = false;
    }
}

// פונקציית תפריט הדיבאג - הזרקת פקודות מדומות עם הגדרת תיקייה 1 וקובץ 1 בלבד
void checkDebugInputs() {
    if (Serial.available() > 0) {
        char debugChar = Serial.read();
        
        // התעלמות מתווי ירידת שורה במקלדת
        if (debugChar == '\n' || debugChar == '\r') return;
        
        Serial.print("פוקוס בדיקה: הפעלת מצב ");
        
        switch (debugChar) {
            case 'i':
                Serial.println("STATE_IDLE");
                currentState = STATE_IDLE;
                break;
                
            case 'c':
                Serial.println("STATE_CODE_SELECTION");
                currentState = STATE_CODE_SELECTION;
                break;
                
            case 'm':
                Serial.println("STATE_MIXING (מדמה ערבוב)");
                currentCommand.commandType = "MIX";
                currentCommand.motorSpeed = 150;
                currentCommand.duration = 10;
                currentState = STATE_MIXING;
                break;
                
            case 'w':
                Serial.println("STATE_WHIPPING (מדמה הקצפה)");
                currentCommand.commandType = "WHIP";
                currentCommand.motorSpeed = 200;
                currentCommand.targetDistance = 15.0;
                currentState = STATE_WHIPPING;
                break;
                
            case 'a':
                Serial.println("STATE_ADD_INGREDIENT (מדמה הוספת חומר: שתיים כוסות קמח)");
                currentCommand.commandType = "ADD";
                currentCommand.amountFolder = 3; currentCommand.amountRecord = 6; // שתיים
                currentCommand.unitFolder   = 2; currentCommand.unitRecord   = 1; // כוסות
                currentCommand.ingFolder    = 1; currentCommand.ingRecord    = 1; // קמח
                currentCommand.targetWeight = 240.0;
                currentState = STATE_ADD_INGREDIENT;
                break;
                
            case 'q':
                Serial.println("STATE_WHIP_AND_ADD (מדמה הקצפה והוספה)");
                currentCommand.commandType = "WHIP_ADD";
                currentCommand.motorSpeed = 160;
                currentCommand.targetDistance = 12.0;
                currentCommand.amountFolder = 3; currentCommand.amountRecord = 3; // מאתיים חמישים
                currentCommand.unitFolder   = 2; currentCommand.unitRecord   = 6; // מיליליטר
                currentCommand.ingFolder    = 1; currentCommand.ingRecord    = 7; // שמנת מתוקה
                currentCommand.targetWeight = 250.0;
                currentCommand.duration = 5;
                newCommandArrived = true;
                currentState = STATE_WHIP_AND_ADD;
                break;
                
            case 'e':
                Serial.println("STATE_EMERGENCY_STOP");
                currentState = STATE_EMERGENCY_STOP;
                break;
                
            case 's':
                Serial.println("STATE_SUCCESS_DONE");
                currentState = STATE_SUCCESS_DONE;
                break;
                
            default:
                Serial.println("לא מוכר. השתמשי בתווים: i, c, m, w, a, q, e, s");
                break;
        }
    }
}