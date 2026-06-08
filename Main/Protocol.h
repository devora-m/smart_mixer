#pragma once

/*
 * Protocol.h — פרוטוקול ה-JSON בין בקר החיישנים (Main) למסך (MixerScreen)
 *
 * כל הודעה היא שורת JSON אחת המסתיימת ב-'\n'.
 * השדה המזהה ("commandType" / "status" / "event") קובע את סוג ההודעה.
 *
 * =====================================================================
 *  Screen → Main  |  פקודות שיוזם המסך
 * =====================================================================
 *
 *  ADD         שדות: commandType, amountFolder, amountRecord,
 *                    unitFolder, unitRecord, ingFolder, ingRecord,
 *                    targetWeight (float, גרמים)
 *
 *  MIX         שדות: commandType, motorSpeed (int 1-10), durationSec (int, שניות)
 *
 *  WHIP        שדות: commandType, motorSpeed (int 1-10),
 *                    targetDistance (float, ס"מ)
 *
 *  MIX_ADD     שדות: commandType, motorSpeed, durationSec*,
 *                    amountFolder, amountRecord, unitFolder, unitRecord,
 *                    ingFolder, ingRecord, targetWeight
 *
 *  WHIP_ADD    שדות: commandType, motorSpeed, targetDistance, durationSec*,
 *                    amountFolder, amountRecord, unitFolder, unitRecord,
 *                    ingFolder, ingRecord, targetWeight
 *
 *              * durationSec = 0  →  עוד רכיב בדרך (המנוע ממשיך, לא עוצרים)
 *                durationSec > 0  →  הרכיב האחרון + זמן ערבוב נוסף אחריו
 *
 *  SELECT_CODE שדות: commandType
 *
 *  STOP        שדות: commandType  (עצירה שיזם המשתמש דרך המסך)
 *
 * =====================================================================
 *  Main → Screen  |  הודעות שיוזם בקר החיישנים
 * =====================================================================
 *
 *  status      שדות: status ("WEIGHT_UPDATE" | "DONE"),
 *                    weight (float, גרמים), time (unsigned long, מילישניות שנותרו)
 *
 *  event       שדות: event ("KEYPAD_STROKE"), key (char אחד)
 *
 *  STOP        שדות: commandType = "STOP", currentStatus (string — שם ה-MixerState)
 *              נשלח אך ורק כאשר המנוע פועל (MIXING / WHIPPING / MIX_AND_ADD / WHIP_AND_ADD)
 *              וכפתור העצירה הפיזי נלחץ. המנוע נעצר מיידית.
 *              currentStatus מאפשר למסך להציג הודעה מתאימה ולהציע:
 *                  המשך          → exec_startCurrentStep()  (חזרה לאותו שלב)
 *                  דלג לשלב הבא  → exec_onDone()            (מתקדמים לשלב הבא)
 *                  בטל           → חזרה למסך הבית
 */

// ----- Screen → Main: command type values -----
#define CMD_ADD             "ADD"
#define CMD_MIX             "MIX"
#define CMD_WHIP            "WHIP"
#define CMD_MIX_ADD         "MIX_ADD"
#define CMD_WHIP_ADD        "WHIP_ADD"
#define CMD_SELECT_CODE     "SELECT_CODE"
#define CMD_STOP            "STOP"
#define CMD_RESUME          "RESUME"  // Screen→Main: הפעל מחדש מנוע וחזור למצב הקודם

// ----- Main → Screen: top-level message keys -----
#define MSG_KEY_STATUS      "status"
#define MSG_KEY_EVENT       "event"
#define MSG_KEY_COMMAND     "commandType"

// ----- "status" field values -----
#define STATUS_WEIGHT_UPDATE "WEIGHT_UPDATE"
#define STATUS_DONE          "DONE"

// ----- "event" field values -----
#define EVENT_KEYPAD_STROKE  "KEYPAD_STROKE"
