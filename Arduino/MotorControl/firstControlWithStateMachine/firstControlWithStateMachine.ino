#include <AFMotor.h>
#include <time.h>
#include <ME480FSM.h>

AF_DCMotor motor1(1); // Create a motor object for motor 1
int currentSpeed = 0;
FSMFastTimer waitTimer (10000000);
FSMFastTimer goTimer (10000000);

bool waitState = true;
bool goState = false;
bool endState = false;

void setup() {
  Serial.begin(9600);
  Serial.print("START---------------");
  delay(2000);
  waitState = true;
}

void loop() {
  // Your code here
  // want to create 3 states. wait, go, end. do this on a timer for now

  waitTimer.update(waitState);
  goTimer.update(goState);

  bool wait_go = waitState && waitTimer.TMR;
  bool wait_wait = waitState && !waitTimer.TMR;
  bool go_end = goState && goTimer.TMR;
  bool go_go = goState && !goTimer.TMR;
  bool end_end = endState;

  waitState = wait_wait;
  goState = wait_go || go_go;
  endState = go_end || end_end;

  if (waitState){
    motor1.setSpeed(0);
  }

  if (goState){
    motor1.setSpeed(255);
  }

  if (endState){
    motor1.setSpeed(0);
  }
}
