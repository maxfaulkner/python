from main_calc import *
import tkinter as tk  
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np

##VARIABLE DECLARTION ------------------------------------------------------------------------------
total_over_time = []
total_with_varying_interest = []

p_var = 0
r_var = 0
n_var = 0
t_var = 0

#FUNCTION DELARATION ------------------------------------------------------------------------------
def performCalc ():
    try:
        #Get the variables together from the user inputs
        p_var = float(entry_p.get())
        r_var = float(entry_r.get())/100
        n_var = float(entry_n.get())
        t_var = float(entry_t.get())

        total = calculate_compound_interest(p_var, r_var, n_var, t_var) #this calculates end total for user provided inputs
        total_over_time = calculate_compound_interest_over_time(p_var, r_var, n_var, t_var) #Calculates the lists that are used to plot from user input
        total_with_varying_interest = calculate_varying_interest_over_time(p_var, r_var, n_var, t_var) #Calculates lists used for plotting varying interest
        update_plot(total_over_time, total_with_varying_interest, r_var) #Updaets the plots with the current total and total over time

        final_values = {rate: values[-1][1] for rate, values in total_with_varying_interest.items()}
        row_start = 1
        for i, (rate, final_value) in enumerate(final_values.items()):
            tk.Label(root, text=f"Rate: {rate:.2%} → Final Value: ${final_value:,.2f}").grid(row=row_start + i, column=1, columnspan=2)

        result_label.config(text=f"After {t_var} Years at {r_var*100}%: ${total:,.2f}")


    except ValueError:
        result_label.config(text=f"Enter only numbers")

def update_plot(total_over_time_local, total_varying_interest, interest_rate_user_provided):
    time_for_plot = []
    interest_for_plot = []
    for time_local, interest_local in total_over_time_local:
        time_for_plot.append(time_local)
        interest_for_plot.append(interest_local)

    ax.clear()
    ax.plot(time_for_plot, interest_for_plot, label=f"Compound Growth: {interest_rate_user_provided:.2%}")
    
    time_varying_for_plot = []
    total_varying_for_plot = []
    rate_variables = {}
    for rate, values in total_varying_interest.items():
        time_varying_for_plot = [time for time, total in values]
        total_varying_for_plot = [total for time, total in values]
        rate_for_plot = rate
        ax.plot(time_varying_for_plot, total_varying_for_plot, label=f"Rate: {rate_for_plot:.2%}")

    ax.legend()
    canvas.draw()

##SHOW AND PLOT EVERYTHING ------------------------------------------------------------------------------
root = tk.Tk()
root.title("Compound Interest Calculator")
root.geometry("1500x1000")

for col in range(10):
    root.columnconfigure(col, weight=1)  # Distribute space equally

# Create input fields and labels
tk.Label(root, text="Initial Amount:").grid(row=0, column=0, padx=1, pady=5, sticky="E")
entry_p = tk.Entry(root)
entry_p.insert(0, "100")
entry_p.grid(row=0, column=1, padx=1, pady=5, sticky="W")

# Create input fields and labels
tk.Label(root, text="Average Rate of Return: (Percentage)").grid(row=1, column=0, padx=1, pady=5, sticky="E")
entry_r = tk.Entry(root)
entry_r.insert(0, "10")
entry_r.grid(row=1, column=1, padx=1, pady=5, sticky="W")

# Create input fields and labels
tk.Label(root, text="Num of Coumpounds Per Year:").grid(row=2, column=0, padx=1, pady=5, sticky="E")
entry_n = tk.Entry(root)
entry_n.insert(0, "1")
entry_n.grid(row=2, column=1, padx=1, pady=5, sticky="W")

# Create input fields and labels
tk.Label(root, text="How Many Years:").grid(row=3, column=0, padx=1, pady=5, sticky="E")
entry_t = tk.Entry(root)
entry_t.insert(0, "10")
entry_t.grid(row=3, column=1, padx=1, pady=5, sticky="W")

# Create the calculate button
calculate_button = tk.Button(root, text="Calculate", command=performCalc)
calculate_button.grid(row=4, column=0, columnspan=2, pady=10)

# Create the result label
result_label = tk.Label(root, text="")
result_label.grid(row=0, column=1, columnspan=2, pady=5)

fig, ax = plt.subplots(figsize=(7,3))  # Create a figure for the graph
canvas = FigureCanvasTkAgg(fig, master=root)  # Embed the figure into tkinter
canvas.get_tk_widget().grid(row=7, column=0, columnspan=2)
ax.set_title("Compound Interest Over Time")
ax.set_xlabel("Time, Years")
ax.set_ylabel("Value, USD")
plt.subplots_adjust(bottom=0.15)


# Run the main loop
root.mainloop()

"""
Need to add - 
    Checkbox for varying interest rate or varying time
    Sliders for how much to vary both of these things
    Clean up code significantly
        Includes probably renaming half of the above haha
    Figure out how to make this a .exe 
"""