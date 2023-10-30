import keyboard
import serial

# Open a serial connection to the Arduino
#ser = serial.Serial('COM3', 9600)  # Replace 'COM3' with the appropriate port and baud rate

# Dictionary to map keys to corresponding commands
key_commands = {
    'a': 'A',
    'd': 'D',
    's': 'S',
    'w': 'W',
    # Add more key-command mappings as needed
}

# Initialize a variable to track the current key being held down
current_key = None

while True:
    event = keyboard.read_event()
    
    if event.event_type == keyboard.KEY_DOWN:
        key = event.name
        #print(event.name)
        if key in key_commands:
            print(f"Key: {key}")
            if current_key != key:
                current_key = key
                #ser.write(key_commands[key].encode())
    elif event.event_type == keyboard.KEY_UP:
        key = event.name
        if key == current_key:
            current_key = None
            print('Key: None')
            # Send a stop command when the key is released (if needed)
            #ser.write(b'S')  # Send 'S' to stop the corresponding action

    # You can add more key-command mappings or actions as needed
