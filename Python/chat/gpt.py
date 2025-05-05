import os
from dotenv import load_dotenv
import openai
import tkinter as tk
from tkinter import ttk

# Load API key from .env file
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

if not openai.api_key or not openai.api_key.startswith("sk-"):
    raise ValueError("❌ API key not found or improperly formatted. Please check your .env file.")

# Function to get a response from OpenAI GPT
def get_gpt_response(prompt):
    try:
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=150
        )
        return response.choices[0].text.strip()
    except Exception as e:
        return f"Error: {e}"

# GUI Application
class ChatGPTApp:
    def __init__(self, root):
        self.root = root
        self.root.title("ChatGPT Assistant")

        # Create a frame for the chat history
        self.chat_frame = tk.Frame(root)
        self.chat_frame.pack(padx=10, pady=10, fill="both", expand=True)

        # Chat history display
        self.chat_history = tk.Text(self.chat_frame, state="disabled", wrap="word", height=20)
        self.chat_history.pack(padx=10, pady=10, fill="both", expand=True)

        # User input field
        self.user_input = tk.Entry(root)
        self.user_input.pack(padx=10, pady=5, fill="x")
        self.user_input.bind("<Return>", self.handle_user_input)

        # Send button
        self.send_button = tk.Button(root, text="Send", command=self.handle_user_input)
        self.send_button.pack(padx=10, pady=5)

    def handle_user_input(self, event=None):
        user_message = self.user_input.get().strip()
        if not user_message:
            return

        # Display user message in chat history
        self.update_chat_history(f"You: {user_message}")
        self.user_input.delete(0, tk.END)

        # Get GPT response
        bot_response = get_gpt_response(user_message)
        self.update_chat_history(f"GPT: {bot_response}")

    def update_chat_history(self, message):
        self.chat_history.config(state="normal")
        self.chat_history.insert(tk.END, message + "\n")
        self.chat_history.config(state="disabled")
        self.chat_history.see(tk.END)

# Main function
def main():
    root = tk.Tk()
    app = ChatGPTApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()