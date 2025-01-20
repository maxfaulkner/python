#include <Wire.h>
#include <Adafruit_L3GD20_U.h>

// Create an instance of the L3GD20H gyroscope
Adafruit_L3GD20_Unified gyro = Adafruit_L3GD20_Unified(20);

// Define the analog input pins for the ADXL335
const int xPin = A0;
const int yPin = A1;
const int zPin = A2;

// Variables for sensor fusion
float angle_gyro = 0; // The estimated angle from the gyroscope
float angle_accel = 0; // The estimated angle from the accelerometer
float angle = 0; // Final estimated tilt angle after complementary filter
float alpha = 0.98; // Filter constant (0.98 means more reliance on gyroscope)
unsigned long previousTime = 0;
const long timerInterval = 10; // Interval in sensor updates in milliseconds

// Variables for PWM motor control
int leftPWM = 0;
int rightPWM = 0;

void setup() {
  // Start the serial communication
  Serial.begin(115200);
  // Wait for serial port to open on native USB devices
  while (!Serial) {
    delay(10);
  }

  Serial.println("L3GD20H Gyroscope Test");

  // Initialize the gyroscope
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
}

void loop() {
  // Get a new sensor event (gyroscope)
  sensors_event_t event;
  gyro.getEvent(&event);
  unsigned long currentTime = millis(); // Main timer for sensor readings

  if ((currentTime - previousTime) >= timerInterval) {
    previousTime = currentTime;
    
    // Read the analog values from the accelerometer
    int xAccelVal = analogRead(xPin);
    int yAccelVal = analogRead(yPin);
    int zAccelVal = analogRead(zPin);

    // Convert accelerometer readings to g (assuming 3.3V reference)
    float xAccel = (xAccelVal - 512) * (3.3 / 1023.0) * 3.0;  // 3g full-scale
    float yAccel = (yAccelVal - 512) * (3.3 / 1023.0) * 3.0;
    float zAccel = (zAccelVal - 512) * (3.3 / 1023.0) * 3.0;

    // Debugging output for converted accelerometer values
    /*
    Serial.print(" | Xa: ");
    Serial.print(xAccelVal);
    Serial.print(" | Ya: ");
    Serial.print(yAccelVal);
    Serial.print(" | Za:");
    Serial.println(zAccelVal);
    */
    

    // Calculate the tilt angle from the accelerometer (in degrees)
    angle_accel = atan2(yAccel, zAccel) * 180.0 / PI;

    // Integrate the gyroscope data to get angular position (angle)
    float gyro_rate = event.gyro.x; // Use the x-axis gyroscope value
    float dt = (currentTime - previousTime) / 1000.0; // Convert time to seconds
    angle_gyro += gyro_rate * dt;

    // Apply the complementary filter to combine accelerometer and gyroscope data
    angle = alpha * (angle_gyro) + (1 - alpha) * (angle_accel);

    // Print sensor values and the calculated tilt angle
    /*
    Serial.print(currentTime);
    Serial.print(" |");
    Serial.print(angle_gyro);  // Gyro angle
    Serial.print(" |");
    Serial.print(angle_accel); // Accelerometer angle
    Serial.print(" |");
    Serial.print(angle);      // Combined angle (output of complementary filter)
    Serial.print(" |");
    Serial.print(xAccelVal);  // Accelerometer X value (raw)
    Serial.print(" |");
    Serial.print(yAccelVal);  // Accelerometer Y value (raw)
    Serial.print(" |");
    Serial.print(zAccelVal);  // Accelerometer Z value (raw)
    Serial.print(" |");
    Serial.print(leftPWM);    // Left motor PWM
    Serial.print(" ,");
    Serial.print(rightPWM);   // Right motor PWM
    Serial.println();
    */
  }
}
