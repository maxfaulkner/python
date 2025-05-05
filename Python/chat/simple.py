# chatbot.py

import datetime
import random

# Store tasks in memory (you could expand this to use JSON later)
tasks = []

# Store dynamic responses
dynamic_responses = {}

def get_response(user_input):
    user_input = user_input.lower()

    # Predefined responses
    responses = {
        "hello": "Hi there!",
        "bye": "Goodbye!",
        "exit": "Goodbye!",
        "help": (
            "Available commands:\n"
            "- hello\n"
            "- time\n"
            "- joke\n"
            "- add task <task>\n"
            "- list tasks\n"
            "- add response <trigger>:<response>\n"
            "- exit"
        ),
        "time": f"The current time is {datetime.datetime.now().strftime('%H:%M:%S')}.",
        "joke": random.choice([
            "Why don't scientists trust atoms? Because they make up everything!",
            "I'm reading a book on anti-gravity. It's impossible to put down.",
            "What do you call a bear with no teeth? A gummy bear."
        ])
    }

    # Merge predefined and dynamic responses
    all_responses = {**responses, **dynamic_responses}

    # Check for exact matches in the dictionary
    if user_input in all_responses:
        return all_responses[user_input]

    # Handle commands with additional input
    if user_input.startswith("add task"):
        task = user_input.replace("add task", "").strip()
        if task:
            tasks.append(task)
            return f"Task added: {task}"
        else:
            return "Please specify a task to add."
    elif "list tasks" in user_input:
        if not tasks:
            return "You have no tasks."
        return "Your tasks:\n" + "\n".join(f"{i+1}. {task}" for i, task in enumerate(tasks))
    elif user_input.startswith("add response"):
        try:
            # Extract trigger and response
            _, data = user_input.split("add response", 1)
            trigger, response = map(str.strip, data.split(":", 1))
            dynamic_responses[trigger] = response
            return f"New response added: '{trigger}' -> '{response}'"
        except ValueError:
            return "Invalid format. Use: add response <trigger>:<response>"
        
    elif user_input.startswith("calc"):
        try:
            expression = user_input.replace("calc", "").strip()
            result = eval(expression)  # Be cautious with eval in production code
            return f"The result of {expression} is {result}."
        except Exception as e:
            return f"Error calculating expression: {e}"

    # Default response for unrecognized commands
    return "Sorry, I don't understand that command. Type 'help' to see available commands."

def main():
    print("Welcome to your terminal assistant! Type 'help' to get started.\n")
    while True:
        user_input = input("You: ")
        response = get_response(user_input)
        print("Bot:", response)
        if "bye" in user_input or "exit" in user_input:
            break

if __name__ == "__main__":
    main()