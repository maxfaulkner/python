#include <Wire.h>
#include <Adafruit_L3GD20_U.h>

// Create an instance of the L3GD20H gyroscope
Adafruit_L3GD20_Unified gyro = Adafruit_L3GD20_Unified(20);

unsigned long previousTime = 0;
const long timerInterval = 50; // Interval in milliseconds for sensor updates

void setup() {
  // Initialize serial communication
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
  unsigned long currentTime = millis();

  if ((currentTime - previousTime) >= timerInterval) {
    previousTime = currentTime;
    Serial.print(currentTime);
    Serial.print(", ");
    Serial.print(event.gyro.x);
    Serial.print(", ");
    Serial.print(event.gyro.y);
    Serial.print(", ");
    Serial.println(event.gyro.z);
  }


}