#include <Wire.h>
#include <Adafruit_L3GD20_U.h>
#include <AFMotor.h>

AF_DCMotor motor2(2); // Create a motor object for motor 2
AF_DCMotor motor3(3); // Create a motor object for motor 3

// Create an instance of the L3GD20H gyroscope
Adafruit_L3GD20_Unified gyro = Adafruit_L3GD20_Unified(20);
// Define the analog input pins for the ADXL335
const int xPin = A0;
const int yPin = A1;
const int zPin = A2;

unsigned long previousTime = 0;
const long timerInterval = 10; //interval in sensor updates in milliseconds 

float leftPMW = 0;
float rightPMW = 0;
int count = 0;


void setup() {
  // Start the serial communication
  Serial.begin(115200);
  // Wait for serial port to open on native USB devices
  while (!Serial) {
    delay(10);
  }

  Serial.println("L3GD20H Gyroscope Test");

 if (!gyro.begin(0x6A)) { // Try address 0x6A first
    Serial.println("Oops ... unable to initialize the L3GD20H at address 0x6A. Check your wiring!");
    while (1);
} else {
    Serial.println("L3GD20H initialized at address 0x6A.");
}


  // Print some information about the sensor
  sensor_t sensor;
  gyro.getSensor(&sensor);
  delay(500);

  motor2.setSpeed(255);
  motor3.setSpeed(0);
  motor2.run(FORWARD);
  motor3.run(FORWARD);
}

void loop() {
  // Get a new sensor event
  sensors_event_t event;
  gyro.getEvent(&event);
  unsigned long currentTime = millis(); //main timer for sensor readings

  if ((currentTime - previousTime) >= timerInterval) {
    previousTime = currentTime;
    // Read the analog values from the accelerometer
    int xAccelVal = analogRead(xPin);
    int yAccelVal = analogRead(yPin); //Aim for this to be 350
    int zAccelVal = analogRead(zPin);

    int xGyroVal = event.gyro.x; //Aim for this to be -4
    int yGyroVal = event.gyro.y; 
    int zGyroVal = event.gyro.z;

    motor2.setSpeed(leftPMW);
    motor3.setSpeed(rightPMW);

    leftPMW = 150;
    rightPMW = 0;

    if (currentTime > 3000 && count == 0){
      motor2.run(BACKWARD);
      motor3.run(BACKWARD);
      count = 0;
    }


    





    // Print the accelerometer values to the Serial Monitor
    //Serial.print("X: ");
    Serial.print(currentTime);
    Serial.print(" |");
    Serial.print(xGyroVal);
    Serial.print(" |");
    Serial.print(yGyroVal);
    Serial.print(" |");
    Serial.print(zGyroVal);
    Serial.print(" |");
    Serial.print(leftPMW);
    Serial.print(" |");
    Serial.print(rightPMW);
    Serial.print(" |");
    //Serial.print(xAccelVal);
    //Serial.print(" |");
    //Serial.print(yAccelVal);
    //Serial.print(" |");
    //Serial.print(zAccelVal);
    //Serial.print(" |");
    //Serial.print(leftPMW);
    //Serial.print(" ,");
    //Serial.print(rightPMW);
    Serial.println();
  }
}
