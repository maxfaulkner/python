import tkinter as tk

def calculate_result():
    try:
        # Get values from input fields
        val1 = float(entry1.get())
        val2 = float(entry2.get())
        val3 = float(entry3.get())
        val4 = float(entry4.get())
        
        # Perform a calculation (e.g., sum of inputs)
        result = val1 + val2 + val3 + val4
        
        # Update the result label
        result_label.config(text=f"Result: {result:.2f}")
    except ValueError:
        result_label.config(text="Please enter valid numbers!")

# Create the main window
root = tk.Tk()
root.title("Tkinter Input Example")

# Create input fields and labels
tk.Label(root, text="Input 1:").grid(row=0, column=0, padx=10, pady=5)
entry1 = tk.Entry(root)
entry1.grid(row=0, column=1, padx=10, pady=5)

tk.Label(root, text="Input 2:").grid(row=1, column=0, padx=10, pady=5)
entry2 = tk.Entry(root)
entry2.grid(row=1, column=1, padx=10, pady=5)

tk.Label(root, text="Input 3:").grid(row=2, column=0, padx=10, pady=5)
entry3 = tk.Entry(root)
entry3.grid(row=2, column=1, padx=10, pady=5)

tk.Label(root, text="Input 4:").grid(row=3, column=0, padx=10, pady=5)
entry4 = tk.Entry(root)
entry4.grid(row=3, column=1, padx=10, pady=5)

# Create the calculate button
calculate_button = tk.Button(root, text="Calculate", command=calculate_result)
calculate_button.grid(row=4, column=0, columnspan=2, pady=10)

# Create the result label
result_label = tk.Label(root, text="Result: ")
result_label.grid(row=5, column=0, columnspan=2, pady=10)

# Run the main loop
root.mainloop()
