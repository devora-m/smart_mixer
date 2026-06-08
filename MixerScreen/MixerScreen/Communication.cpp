#include "Communication.h"
#include "Config.h"
#include "UI.h"
#include "RecipeExecutor.h"

static String serialBuffer = "";

void comm_init() {
    Serial2.begin(UART_BAUD_RATE, SERIAL_8N1, UART_RX_PIN, UART_TX_PIN);
    serialBuffer.reserve(256);
    Serial.println("[Comm] תקשורת UART אותחלה בהצלחה");
}

void comm_pumpMessages() {
    while (Serial2.available() > 0) {
        char inChar = (char)Serial2.read();
        
        if (inChar == '\n') {
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, serialBuffer);
            
            if (!error) {
                // 1. הודעת סטטוס מהבקר (weight update או סיום שלב)
                if (doc.containsKey(MSG_KEY_STATUS)) {
                    float weightVal   = doc["weight"].as<float>();
                    String statusStr  = doc[MSG_KEY_STATUS].as<String>();

                    ui_setWeight(weightVal);
                    ui_setStatus(statusStr.c_str());

                    if (statusStr == STATUS_DONE) {
                        exec_onDone();
                    }

                    Serial.print("[Comm] Status: ");
                    Serial.print(statusStr);
                    Serial.print(" weight=");
                    Serial.println(weightVal);
                }
                // 2. הודעת לחיצת מקש מהמקלדת הפיזית
                else if (doc.containsKey(MSG_KEY_EVENT) &&
                         strcmp(doc[MSG_KEY_EVENT], EVENT_KEYPAD_STROKE) == 0) {
                    const char* keyStr = doc["key"];
                    if (keyStr != NULL) {
                        ui_handleKeypadInput(keyStr[0]);
                        Serial.print("[Comm] Keypad: ");
                        Serial.println(keyStr[0]);
                    }
                }
                // 3. עצירה שיזם הבקר (כפתור פיזי) — מציג מסך STOP
                else if (doc.containsKey(MSG_KEY_COMMAND) &&
                         strcmp(doc[MSG_KEY_COMMAND], CMD_STOP) == 0) {
                    const char* statusAtStop = doc["currentStatus"] | "UNKNOWN";
                    Serial.print("[Comm] Physical STOP received. State was: ");
                    Serial.println(statusAtStop);
                    ui_showStopScreen(statusAtStop);
                }
            } else {
                Serial.print("[Comm] שגיאת פענוח: ");
                Serial.println(error.c_str());
            }
            serialBuffer = "";
        } else {
            serialBuffer += inChar;
        }
    }
}
// =====================================================
//  מימוש פונקציות השליחה (יצירת JSON ושליחתו לבקר הראשי)
// =====================================================

void comm_sendAddCommand(int amountFolder, int amountRecord,
                         int unitFolder,   int unitRecord,
                         int ingFolder,    int ingRecord,
                         float targetWeight) {
    StaticJsonDocument<256> doc;
    doc[MSG_KEY_COMMAND] = CMD_ADD;
    doc["amountFolder"]  = amountFolder;
    doc["amountRecord"]  = amountRecord;
    doc["unitFolder"]    = unitFolder;
    doc["unitRecord"]    = unitRecord;
    doc["ingFolder"]     = ingFolder;
    doc["ingRecord"]     = ingRecord;
    doc["targetWeight"]  = targetWeight;
    
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] נשלחה פקודת ADD");
}

void comm_sendMixCommand(int speed, int durationSec, int folderNum, int recordNum) {
    StaticJsonDocument<256> doc;
    doc[MSG_KEY_COMMAND] = CMD_MIX;
    doc["motorSpeed"]    = speed;
    doc["durationSec"]   = durationSec;
    doc["folderNum"]     = folderNum;
    doc["recordNum"]     = recordNum;
    
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] נשלחה פקודת MIX");
}

void comm_sendWhipCommand(int speed, float targetDistance, int folderNum, int recordNum) {
    StaticJsonDocument<256> doc;
    doc[MSG_KEY_COMMAND]   = CMD_WHIP;
    doc["motorSpeed"]      = speed;
    doc["targetDistance"]  = targetDistance;
    doc["folderNum"]       = folderNum;
    doc["recordNum"]       = recordNum;
    
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] נשלחה פקודת WHIP");
}

void comm_sendMixAddCommand(int speed, int folderNum, int recordNum, float targetWeight, int durationSec) {
    StaticJsonDocument<256> doc;
    doc[MSG_KEY_COMMAND] = CMD_MIX_ADD;
    doc["motorSpeed"]    = speed;
    doc["folderNum"]     = folderNum;
    doc["recordNum"]     = recordNum;
    doc["targetWeight"]  = targetWeight;
    doc["durationSec"]   = durationSec;
    
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] נשלחה פקודת MIX_ADD");
}

void comm_sendWhipAddCommand(int speed, float targetDistance, int folderNum, int recordNum, float targetWeight, int durationSec) {
    StaticJsonDocument<256> doc;
    doc[MSG_KEY_COMMAND]  = CMD_WHIP_ADD;
    doc["motorSpeed"]     = speed;
    doc["targetDistance"] = targetDistance;
    doc["folderNum"]      = folderNum;
    doc["recordNum"]      = recordNum;
    doc["targetWeight"]   = targetWeight;
    doc["durationSec"]    = durationSec;
    
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] נשלחה פקודת WHIP_ADD");
}

void comm_sendSelectCodeCommand() {
    StaticJsonDocument<64> doc;
    doc[MSG_KEY_COMMAND] = CMD_SELECT_CODE;
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] Sent SELECT_CODE");
}

void comm_sendStopCommand() {
    StaticJsonDocument<64> doc;
    doc[MSG_KEY_COMMAND] = CMD_STOP;
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] נשלחה פקודת STOP");
}

void comm_sendResumeCommand() {
    StaticJsonDocument<64> doc;
    doc[MSG_KEY_COMMAND] = CMD_RESUME;
    serializeJson(doc, Serial2);
    Serial2.println();
    Serial.println("[Comm] נשלחה פקודת RESUME");
}