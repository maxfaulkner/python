int counter = 0; // Counter variable

void setup() {
  Serial.begin(115200); // Initialize serial communication at 115200 baud rate
}

void loop() {
  // Read any available serial input
  //Serial.println(Serial.available());
  if (Serial.available() > 0) {
    char incomingByte = Serial.read();
    if (incomingByte == 'D') {
      counter++; // Increment counter when 'D' is received
      Serial.println("RIGHT");
    }
    if (incomingByte == 'A') {
      counter++; // Increment counter when 'D' is received
      Serial.println("LEFT");
    }
    if (incomingByte == 'S') {
      counter++; // Increment counter when 'D' is received
      Serial.println("DOWN");
    }
    if (incomingByte == 'W') {
      counter++; // Increment counter when 'D' is received
      Serial.println("UP");
    }
  }
}
