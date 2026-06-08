// States.h
#ifndef STATES_H
#define STATES_H

#include <Arduino.h>

extern bool newCommandArrived; 
extern float currentWeight; 
extern int distance;        

// הגדרת מצבי המערכת הראשיים
enum MixerState {
    STATE_IDLE,                 
    STATE_CODE_SELECTION,       
    STATE_MIXING,               
    STATE_WHIPPING,             
    STATE_ADD_INGREDIENT,     
    STATE_MIX_AND_ADD,          
    STATE_WHIP_AND_ADD,         
    STATE_EMERGENCY_STOP,       
    STATE_SUCCESS_DONE          
};

struct StepCommand {
    String commandType;
    // שדות הקול לפקודת ADD (כמות + כלי + חומר)
    int amountFolder;
    int amountRecord;
    int unitFolder;
    int unitRecord;
    int ingFolder;
    int ingRecord;
    // שדות כלליים
    float targetWeight;
    int motorSpeed;
    int duration;
    float targetDistance;
};

extern MixerState currentState;
extern MixerState previousState;
extern StepCommand currentCommand;

#endif