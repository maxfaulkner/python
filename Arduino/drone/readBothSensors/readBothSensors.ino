#include <Wire.h>
#include <Adafruit_L3GD20_U.h>

// Create an instance of the L3GD20H gyroscope
Adafruit_L3GD20_Unified gyro = Adafruit_L3GD20_Unified(20);

// Define the analog input pins for the ADXL335
const int xPin = A0;
const int yPin = A1;
const int zPin = A2;

unsigned long previousTime = 0;
const long timerInterval = 50; //interval in sensor updates in milliseconds 

void setup() {
  // Start the serial communication
  Serial.begin(115200);
  // Wait for serial port to open on native USB devices
  while (!Serial) {
    delay(10);
  }

  Serial.println("L3GD20H Gyroscope Test");

  // Initialize the gyroscope
  if (!gyro.begin()) {
    Serial.println("Oops ... unable to initialize the L3GD20H. Check your wiring!");
    while (1);
  }

  // Print some information about the sensor
  sensor_t sensor;
  gyro.getSensor(&sensor);
  delay(500);
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
    int yAccelVal = analogRead(yPin);
    int zAccelVal = analogRead(zPin);

    int xGyroVal = event.gyro.x;
    int yGyroVal = event.gyro.y;
    int zGyroVal = event.gyro.z;

    // Print the accelerometer values to the Serial Monitor
    //Serial.print("X: ");
    Serial.print(currentTime);
    Serial.print(" ,");
    Serial.print(xGyroVal);
    Serial.print(" ,");
    Serial.print(yGyroVal);
    Serial.print(" ,");
    Serial.print(zGyroVal);
    Serial.print(" ,");
    Serial.print(xAccelVal);
    Serial.print(" ,");
    Serial.print(yAccelVal);
    Serial.print(" ,");
    Serial.print(zAccelVal);
    Serial.println();
  }
}
