import random

def guess(x):
    random_number = random.randint(1, x)
    userNum = 0
    while random_number != userNum:
        userNum = int(input("Guess a number from 1 to {x}: "))
        if userNum > random_number:
            print("Too High, Try Again")
        elif userNum < random_number:
            print("Too Low, Try Again")
    print ("YAY, You Win")

guess(10)