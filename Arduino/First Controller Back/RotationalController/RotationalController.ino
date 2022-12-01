#include <Wire.h>
#include <Zumo32U4.h>
#include <ME480FSM.h> //include ME480 FSM Timer Counter library


Zumo32U4Motors motors;
Zumo32U4ProximitySensors proxSensors;
Zumo32U4ButtonC buttonC;
Zumo32U4ButtonB buttonB;

FSMFastTimer buttonCTimer(2000000);
FSMFastTimer secondSpeedTimer(500000);

bool wait = true;
bool firstSpeed = false;
bool secondSpeed = false;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  proxSensors.initFrontSensor();
  Wire.begin();
}

void loop() {
  proxSensors.read();

  int proxCounts = proxSensors.countsFrontWithRightLeds();
  //Block 1
  buttonCTimer.update(firstSpeed);
  secondSpeedTimer.update(secondSpeed);


  
//block 2
  bool wait_firstSpeed = wait && buttonC.isPressed();
  bool firstSpeed_firstSpeed = firstSpeed && !buttonCTimer.TMR;
  bool firstSpeed_secondSpeed = firstSpeed && buttonCTimer.TMR;
  bool secondSpeed_secondSpeed = secondSpeed && !secondSpeedTimer.TMR;
  bool secondSpeed_wait = secondSpeed && secondSpeedTimer.TMR;
  bool wait_wait = wait && !buttonC.isPressed();

  

//block 3
  
  firstSpeed = wait_firstSpeed || firstSpeed_firstSpeed;
  secondSpeed = firstSpeed_secondSpeed || secondSpeed_secondSpeed;
  wait = secondSpeed_wait || wait_wait;
  

  if (wait){
    motors.setSpeeds(0,0);
  }

  if (firstSpeed){
    motors.setSpeeds(100,100);
  }

  if (secondSpeed){
    motors.setSpeeds(200,200);
  }

  Serial.print(wait);
  Serial.print('\t');
  Serial.print(firstSpeed);
  Serial.print('\t');
  Serial.println(buttonC.isPressed());
  delayMicroseconds(1000);
}
