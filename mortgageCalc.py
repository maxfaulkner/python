import tkinter as tk

window = tk.Tk()
window.geometry("500x500")

# The function which will add the numbers in the inputes and output the sum
def calculate():
    output_input.delete(0, tk.END)
    num1 = int(input1.get())
    num2 = int(input2.get())
    num3 = int(input3.get())
    num4 = int(input4.get())
    sum = num1 + num2 + num3 + num4
    output_input.insert(0, sum)

def clear():
    output_input.delete(0, tk.END)

#create the inputes
input1 = tk.Entry(window)
input2 = tk.Entry(window)
input3 = tk.Entry(window)
input4 = tk.Entry(window)
input1.grid(row=0, column=0)
input2.grid(row=0, column=1)
input3.grid(row=3, column=0)
input4.grid(row=3, column=1)

# Add labels to the bottom of the inputes
label1 = tk.Label(window, text="Box 1")
label2 = tk.Label(window, text="Box 2")
label3 = tk.Label(window, text="Box 3")
label4 = tk.Label(window, text="Box 4")
outputLabel = tk.Label(window, text = "Output")

label1.grid(row=1, column=0, rowspan=2)
label2.grid(row=1, column=1, rowspan=2)
label3.grid(row=4, column=0, rowspan=2)
label4.grid(row=4, column=1, rowspan=2)
outputLabel.grid(row=7,column=1)

# Create the button and the output input
calcButton = tk.Button(window, text="Calculate", command=calculate)
calcButton.grid(row=6, column=0)
clearButton = tk.Button(window, text = "Clear", command = clear)
clearButton.grid(row=7, column =0)
output_input = tk.Entry(window)
output_input.grid(row=6, column=1)

# Run the application
window.mainloop()
