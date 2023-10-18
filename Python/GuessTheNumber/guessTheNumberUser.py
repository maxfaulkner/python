import random

def get_numbers():
    user_x = int(input("what is x: "))
    user_y = int(input("what is y: "))
    return (user_x, user_y)

def giveCompNumberAndGetFirstGuess(numbers):
    x = numbers[0]
    y = numbers[1]
    print(x,y)
    current_guess = (x+y)//2
    user_input = 5
    while user_input != 0:
        print("Is it " + str(current_guess))
        user_input = int(input("Is this right?: "))
        if user_input == 9:
            print("Oh No! too high")
            current_guess = current_guess - 2
        elif user_input ==1:
            print("Oh No! too low")
            current_guess += 1
    print("YAY")

giveCompNumberAndGetFirstGuess(get_numbers()) #so this gets me a random number between the user defined inputs