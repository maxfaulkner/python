int counter = 0; // Counter variable

float fl_mot1 = 0;
float fr_mot2 = 0;
float rl_mot3 = 0;
float rr_mot4 = 0;

void setup() {
  Serial.begin(115200); // Initialize serial communication at 115200 baud rate
}

void loop() {
  // Read any available serial input
  //Serial.println(Serial.available());
  if (Serial.available() > 0) {
    char incomingByte = Serial.read();
    if (incomingByte == 'D') {
      Serial.print("RIGHT");
      fl_mot1 = 1.00;
      fr_mot2 = 0.70;
      rl_mot3 = 1.00;
      rr_mot4 = 0.70;
    }
    if (incomingByte == 'A') {
      Serial.print("LEFT");
      fl_mot1 = 0.70;
      fr_mot2 = 1.00;
      rl_mot3 = 0.70;
      rr_mot4 = 1.00;
    }
    if (incomingByte == 'S') {      
      Serial.print("DOWN");
      fl_mot1 = 0.20;
      fr_mot2 = 0.20;
      rl_mot3 = 0.20;
      rr_mot4 = 0.20;
    }
    if (incomingByte == 'W') {     
      Serial.print("UP");
      fl_mot1 = 0.90;
      fr_mot2 = 0.90;
      rl_mot3 = 0.90;
      rr_mot4 = 0.90;
    }
    if (incomingByte == 'Z') {      
      Serial.print("SPIN_LEFT");
      fl_mot1 = 1.00;
      fr_mot2 = 0.70;
      rl_mot3 = 0.70;
      rr_mot4 = 1.00;
    }
    if (incomingByte == 'X') {
      Serial.print("SPIN_RIGHT");
      fl_mot1 = 0.70;
      fr_mot2 = 1.00;
      rl_mot3 = 1.00;
      rr_mot4 = 0.70;
    }
    Serial.print(", ");
    Serial.print(fl_mot1);
    Serial.print(", ");
    Serial.print(fr_mot2);
    Serial.print(", ");
    Serial.print(rl_mot3);
    Serial.print(", ");
    Serial.print(rr_mot4);
  }
}