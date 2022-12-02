#include <Wire.h>
#include <Zumo32U4.h>
#include <ME480FSM.h> //include ME480 FSM Timer Counter library


Zumo32U4Motors motors;
Zumo32U4ProximitySensors proxSensors;
Zumo32U4ButtonC buttonC;
Zumo32U4ButtonB buttonB;
Zumo32U4IMU imu;

FSMFastTimer buttonCTimer(3000000);
FSMFastTimer secondSpeedTimer(30000000);
FSMFastTimer thirdSpeedTimer(10000000);

bool wait = true;
bool firstSpeed = false;
bool secondSpeed = false;

double t;
double t_old;
double dT;
double trueZumoAngle;

//PROVIDED CODE FOR FOLLOWING THE ROTATION
const byte addressDevice   = 0x6B;  //hexadecimal device address for your IMU chip
const byte addressRegister = 0x23;  //hexadecimal register address for dps sensitivity
const byte code245dpsFS    = 0x00;  //hexadecimal code for 245dps full scale
const byte code500dpsFS    = 0x10;  //hexadecimal code for 500dps full scale
const byte code2000dpsFS   = 0x20;  //hexadecimal code for 2000dps full scale



double Integral_RotationalVelocity;

double zumo_deg;


float kp_rotPos = 15;
float kd_rotPos = .9;
float ki_rotPos = 1;

//float desiredPos_rotPos;
float currentPos_rotPos;
float error_rotPos;
float error_old_rotPos;
float deriv_error_rotPos;
float u_rotPos;
float initial_output_rotPos;
float step1_rotPos;
float desiredPos_rotPos = 360;

double t2;
double t_old2;
double dt_sec;


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

  /*  
  The function below uses 8-bit codes to identify a device you want to 
  communicate with, the address on that device you want to write to, and 
  value you want to store at that address.  In our case we are writing 
  to the LSM6DS33 IMU chip and putting a value for the full scale dps in
  the appropriate memory location (or register).
   */
  imu.writeReg(addressDevice, addressRegister, code2000dpsFS); //set resolution to 2000dps
  
  
}

void loop() {
  proxSensors.read();
  imu.read();
  t_old = t;
  t = millis();
  dT = (t-t_old)/1000;

  t_old2 = t2; 
  t2 = micros();
  dt_sec = (t2-t_old2)/1000000;

  int proxCounts = proxSensors.countsFrontWithRightLeds();
  //Block 1
  buttonCTimer.update(firstSpeed);
  secondSpeedTimer.update(secondSpeed);
  thirdSpeedTimer.update(true);
  
  
  zumo_deg = imu.g.z * (70.0/1000);


  currentPos_rotPos = trueZumoAngle;

  error_old_rotPos =error_rotPos;
  error_rotPos = desiredPos_rotPos - currentPos_rotPos;

  deriv_error_rotPos = (error_rotPos - error_old_rotPos)/dt_sec;

  u_rotPos = (kp_rotPos*error_rotPos) + (kd_rotPos*deriv_error_rotPos);
  
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
    motors.setSpeeds(0,0);
  }

  if (secondSpeed){
    motors.setSpeeds(-u_rotPos,u_rotPos);
  }

  if (secondSpeed && u_rotPos > 400){
    motors.setSpeeds(-400,400);
  }


  trueZumoAngle = trueZumoAngle + ((imu.g.z * (70.0/1000))*dT);
  trueZumoAngle = trueZumoAngle +.0125; //Had to add in this offset to compensate for drift
  
  Serial.print(t);
  Serial.print('\t');
  Serial.print(error_rotPos);
  Serial.print('\t');
  Serial.println(trueZumoAngle);
  delayMicroseconds(1000);
}
