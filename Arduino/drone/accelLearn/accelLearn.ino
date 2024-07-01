// Define the analog input pins for the ADXL335
const int xPin = A0;
const int yPin = A1;
const int zPin = A2;

unsigned long previousTime = 0;
const long timerInterval = 50; //interval in sensor updates in milliseconds 

void setup() {
  // Start the serial communication
  Serial.begin(115200);
}

void loop() {
  unsigned long currentTime = millis(); //main timer for sensor readings

  if ((currentTime - previousTime) >= timerInterval) {
    previousTime = currentTime;
    // Read the analog values from the accelerometer
    int xValue = analogRead(xPin);
    int yValue = analogRead(yPin);
    int zValue = analogRead(zPin);

    // Print the accelerometer values to the Serial Monitor
    //Serial.print("X: ");
    Serial.print(currentTime);
    Serial.print(" ,");
    Serial.print(xValue);
    Serial.print(" ,");
    Serial.print(yValue);
    Serial.print(" ,");
    Serial.print(zValue);
    Serial.println();
  }
}
