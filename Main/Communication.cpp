#include "Communication.h"

static String serialBuffer = "";

// ממיר את מצבי המנוע הפעיל למחרוזת — משמש לשדה currentStatus בהודעת STOP.
// נקרא רק מ-checkStopButton(), כך שהקלט תמיד אחד מ-4 המצבים האלה.
static const char* stateToString(MixerState state) {
    switch (state) {
        case STATE_MIXING:      return "STATE_MIXING";
        case STATE_WHIPPING:    return "STATE_WHIPPING";
        case STATE_MIX_AND_ADD: return "STATE_MIX_AND_ADD";
        case STATE_WHIP_AND_ADD:return "STATE_WHIP_AND_ADD";
        default:                return "UNKNOWN";
    }
}

void initCommunication() {
    Serial1.begin(115200, SERIAL_8N1, SCREEN_RX_PIN, SCREEN_TX_PIN);
    Serial.begin(115200);
    Serial.println("[Comm] Sensor controller started. Serial1 -> Screen (pins 25, 21)");
    serialBuffer.reserve(256);
}

void sendStatusToScreen(const char* statusType, float weight, unsigned long timeLeftMs) {
    StaticJsonDocument<128> doc;
    doc[MSG_KEY_STATUS] = statusType;
    doc["weight"]       = weight;
    doc["time"]         = timeLeftMs;
    serializeJson(doc, Serial1);
    Serial1.println();
}

void sendKeypadStrokeToScreen(char key) {
    StaticJsonDocument<64> doc;
    doc[MSG_KEY_EVENT] = EVENT_KEYPAD_STROKE;
    doc["key"]         = String(key);
    serializeJson(doc, Serial1);
    Serial1.println();
}

void sendStopToScreen(MixerState stateAtStop) {
    StaticJsonDocument<128> doc;
    doc[MSG_KEY_COMMAND]  = CMD_STOP;
    doc["currentStatus"]  = stateToString(stateAtStop);
    serializeJson(doc, Serial1);
    Serial1.println();
    Serial.print("[Comm] STOP sent to screen. State was: ");
    Serial.println(stateToString(stateAtStop));
}

void checkIncomingSerial() {
    while (Serial1.available() > 0) {
        char inChar = (char)Serial1.read();

        if (inChar == '\n' || inChar == '\r') {
            if (serialBuffer.length() > 0) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, serialBuffer);

                if (error) {
                    Serial.print("[Comm] JSON parse error: ");
                    Serial.println(error.c_str());
                } else {
                    // שמור את מהירות המנוע הקודמת לפני שהפרסינג מדרס אותה
                    int lastMotorSpeed = currentCommand.motorSpeed;

                    currentCommand.commandType    = doc[MSG_KEY_COMMAND].as<String>();
                    currentCommand.amountFolder   = doc["amountFolder"]   | 0;
                    currentCommand.amountRecord   = doc["amountRecord"]   | 0;
                    currentCommand.unitFolder     = doc["unitFolder"]     | 0;
                    currentCommand.unitRecord     = doc["unitRecord"]     | 0;
                    currentCommand.ingFolder      = doc["ingFolder"]      | 0;
                    currentCommand.ingRecord      = doc["ingRecord"]      | 0;
                    currentCommand.targetWeight   = doc["targetWeight"]   | 0.0f;
                    currentCommand.motorSpeed     = doc["motorSpeed"]     | 0;
                    currentCommand.duration       = doc["durationSec"]    | 0;
                    currentCommand.targetDistance = doc["targetDistance"] | 0.0f;

                    Serial.print("[Comm] Command received: ");
                    Serial.println(currentCommand.commandType);

                    if      (currentCommand.commandType == CMD_ADD)         currentState = STATE_ADD_INGREDIENT;
                    else if (currentCommand.commandType == CMD_MIX)         currentState = STATE_MIXING;
                    else if (currentCommand.commandType == CMD_WHIP)        currentState = STATE_WHIPPING;
                    else if (currentCommand.commandType == CMD_MIX_ADD) {
                        // אם כבר במצב MIX_AND_ADD — רכיב ברצף; אלמנת — פתיחת השלב
                        if (currentState == STATE_MIX_AND_ADD) newCommandArrived = true;
                        currentState = STATE_MIX_AND_ADD;
                    }
                    else if (currentCommand.commandType == CMD_WHIP_ADD) {
                        if (currentState == STATE_WHIP_AND_ADD) newCommandArrived = true;
                        currentState = STATE_WHIP_AND_ADD;
                    }
                    else if (currentCommand.commandType == CMD_STOP)        currentState = STATE_IDLE;
                    else if (currentCommand.commandType == CMD_SELECT_CODE) currentState = STATE_CODE_SELECTION;
                    else if (currentCommand.commandType == CMD_RESUME) {
                        // הפעל מחדש מנוע עם המהירות שהייתה לפני העצירה
                        runMotor(lastMotorSpeed);
                        currentState = previousState;
                    }
                }
                serialBuffer = "";
            }
        } else {
            serialBuffer += inChar;
        }
    }
}
