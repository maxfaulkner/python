unsigned long previousTime = 0;
const long timerInterval = 50;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:
  unsigned long currentTime = millis();

  if ((currentTime - previousTime) >= timerInterval) {
    previousTime = currentTime ;
    Serial.println(currentTime);
  }

}
