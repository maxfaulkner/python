#include <AFMotor.h>


AF_DCMotor motor1(1); // Create a motor object for motor 1
int currentSpeed = 0;

void setup() {
  Serial.begin(115200);
  motor1.setSpeed(0); // Set motor speed (0 to 255)
  motor1.run(FORWARD); // Turn the motor on in the FORWARD direction
}

void loop() {
  // Your code here
  motor1.setSpeed(currentSpeed);
  currentSpeed = currentSpeed + 20;
  Serial.println(currentSpeed);



  delay(2000); // Delay for 2 seconds
}
