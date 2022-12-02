#include <Wire.h>
#include <Zumo32U4.h>
#include <ME480FSM.h> //include ME480 FSM Timer Counter library


Zumo32U4Motors motors;
Zumo32U4ProximitySensors proxSensors;
Zumo32U4ButtonC buttonC;
Zumo32U4ButtonB buttonB;
Zumo32U4IMU imu;
Zumo32U4Encoders encoders;

FSMTimer startTimer(3000);
RisingEdgeCounter turnNumber (3); 

bool wait = true;
bool turnControl = false;
bool fwdControl = false; 

double error_fwd;
double u_fwdControl;

double t;
double t_old;
double dT;
double trueZumoAngle;

//Rotational Controller variables
float error_turn;
float u_rotPos;
float currentPos_rotPos;
float error_rotPos;
float error_old_rotPos;
float deriv_error_rotPos;
int desiredPos_rotPos[] = {45,135,360};

float kp_rotPos = 15;
float kd_rotPos = .9;

//Translational Controller variables
double calculateCounts;
int travelDistanceM[] = {1 , 0.1 , 0.2};
double currnetCounts;
double errorOldTrans;
double errorCurrentTrans;
double derivErrorTrans;

float kpTrans = 1;
float kdTrans = .5; 



//PROVIDED CODE FOR FOLLOWING THE ROTATION
const byte addressDevice   = 0x6B;  //hexadecimal device address for your IMU chip
const byte addressRegister = 0x23;  //hexadecimal register address for dps sensitivity
const byte code245dpsFS    = 0x00;  //hexadecimal code for 245dps full scale
const byte code500dpsFS    = 0x10;  //hexadecimal code for 500dps full scale
const byte code2000dpsFS   = 0x20;  //hexadecimal code for 2000dps full scale



void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  proxSensors.initFrontSensor();
  Wire.begin();


    // try to initialize the imu and report an error if initialization fails
  if (!imu.init())
  {
    // Failed to detect the compass.
    ledRed(1);
    while(1)
    {
      Serial.println(F("Failed to initialize IMU sensors."));
      delay(100);
    }
  }

  imu.enableDefault();
  imu.configureForTurnSensing(); 

  imu.writeReg(addressDevice, addressRegister, code2000dpsFS); //set resolution to 2000dps
  
  
}


void loop() {
  // put your main code here, to run repeatedly:
  imu.read();
  t_old = t;
  t = micros();
  dT = (t-t_old)/1000000;

  //Block 1 - Update everything and controllers live here

  // Update counter so we know which number to go after
  turnNumber.update(turnControl,0,wait);


  //Rotational Controller 
  trueZumoAngle = trueZumoAngle + ((imu.g.z * (70.0/1000))*dT);
  trueZumoAngle = trueZumoAngle +.0125; //Had to add in this offset to compensate for drift
  
  currentPos_rotPos = trueZumoAngle;

  error_old_rotPos =error_rotPos;
  error_rotPos = desiredPos_rotPos[turnNumber.count] - currentPos_rotPos;

  deriv_error_rotPos = (error_rotPos - error_old_rotPos)/dT;

  u_rotPos = (kp_rotPos*error_rotPos) + (kd_rotPos*deriv_error_rotPos);

  //Translational Controller
  calculateCounts = (travelDistanceM[turnNumber.count] * 3090)/60; //conversion from meters to counts
  
  currnetCounts = encoders.getCountsLeft();

  errorOldTrans = errorCurrentTrans;
  errorCurrentTrans = calculateCounts - currnetCounts;

  derivErrorTrans = (errorOldTrans - errorCurrentTrans) /dT;

  u_fwdControl = (kpTrans * errorCurrentTrans) + (kdTrans*derivErrorTrans);


  //Block 2 - Init transitions if needed

  //Transitions
  bool wait_fwd = wait && buttonC.isPressed();
  bool fwd_turn = fwdControl && errorCurrentTrans < .05 && errorCurrentTrans > -0.05;
  bool turn_fwd = turnControl && error_rotPos <.05 && error_rotPos > -0.05;
  bool turn_wait = turnControl && error_rotPos <.05 && error_rotPos > -0.05 && turnNumber.count > 4;

  // Latches
  bool wait_wait = wait && !buttonC.isPressed();
  bool fwd_fwd = fwdControl && errorCurrentTrans > .05 || errorCurrentTrans < -0.05;
  bool turn_turn = turnControl && error_rotPos >.05 || error_rotPos < -0.05;

  //Block 3 - Link states with the transitions they correspond to
  
  wait = wait_wait || turn_wait;
  turnControl = fwd_turn || turn_turn;
  fwdControl = turn_fwd || fwd_fwd || wait_fwd;


  //Block 4 - If statements and such (Do what happens in each state)


  //If statements to control the motors in varying states
  if (wait) {
    motors.setSpeeds(0,0);
  }

  if (turnControl) {
    motors.setSpeeds(-u_rotPos, u_rotPos);
  }

  if (turnControl && u_rotPos > 400) {
    motors.setSpeeds(-400, 400);
  }

  if (fwdControl){
    motors.setSpeeds(u_fwdControl, u_fwdControl);
  }

  if (fwdControl && u_fwdControl > 400){
    motors.setSpeeds(400, 400);
  }





  

  Serial.print(wait);
  Serial.print('\t');
  Serial.print(fwdControl);
  Serial.print('\t');
  Serial.print(turnControl);
  Serial.print('\t');

  
  Serial.print(wait_fwd);
  Serial.print('\t');
  Serial.print(fwd_turn);
  Serial.print('\t');
  Serial.print(turn_fwd);
  Serial.print('\t');
  Serial.print(fwd_fwd);
  Serial.print('\t');
  Serial.print(turn_turn);
  Serial.print('\t');

  
  //Serial.print(error_rotPos);
  //Serial.print('\t');
  Serial.print(errorCurrentTrans);
  Serial.print('\t');

  
  Serial.println(u_fwdControl);
  //Serial.print('\t');
  //Serial.println(u_rotPos);






  delayMicroseconds(1000);

}
