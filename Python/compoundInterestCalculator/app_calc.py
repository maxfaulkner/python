from main_calc import calculate_compound_interest
import tkinter as tk 

def performCalc ():
    try:
        total = calculate_compound_interest(
            float(entry_p.get()), 
            float(entry_r.get()), 
            float(entry_n.get()), 
            float(entry_t.get()))
        result_label.config(text=f"Result: {total:.2f}")
    except ValueError:
        result_label.config(text=f"Enter only numbers")

root = tk.Tk()
root.title("Compound Interest Calculator")

# Create input fields and labels
tk.Label(root, text="Input Initial Amount:").grid(row=0, column=0, padx=10, pady=5)
entry_p = tk.Entry(root)
entry_p.grid(row=0, column=1, padx=10, pady=5)

# Create input fields and labels
tk.Label(root, text="Input Rate of Return:").grid(row=1, column=0, padx=10, pady=5)
entry_r = tk.Entry(root)
entry_r.grid(row=1, column=1, padx=10, pady=5)

# Create input fields and labels
tk.Label(root, text="Input Num of Coumpounds Per Year:").grid(row=2, column=0, padx=10, pady=5)
entry_n = tk.Entry(root)
entry_n.grid(row=2, column=1, padx=10, pady=5)

# Create input fields and labels
tk.Label(root, text="Input How Many Years:").grid(row=3, column=0, padx=10, pady=5)
entry_t = tk.Entry(root)
entry_t.grid(row=3, column=1, padx=10, pady=5)

# Create the calculate button
calculate_button = tk.Button(root, text="Calculate", command=performCalc)
calculate_button.grid(row=4, column=0, columnspan=2, pady=10)

# Create the result label
result_label = tk.Label(root, text="Result: ")
result_label.grid(row=5, column=0, columnspan=2, pady=10)

# Run the main loop
root.mainloop()