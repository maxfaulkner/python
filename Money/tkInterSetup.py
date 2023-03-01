import tkinter as tk
import functionsSetup

window = tk.Tk()
window.title("Net Worth Calculator")
window.geometry("750x500")

def updateToNew():
    inputs=[]
    for i in range(len(entries)):
        inputs.append(entries[i].get())
    output1.config(text =functionsSetup.calculate(*inputs)[0])
    debtOuput.config(text =functionsSetup.calculate(*inputs)[1])
    networthLabel = tk.Label(window, text='Net Worth', font=('Arial', 20))
    networthLabel.grid(row=1, column=3, padx=50, columnspan=2)
    debtLabel = tk.Label(window, text='Current Debt', font=('Arial', 20))
    debtLabel.grid(row=4, column=3, padx=50, columnspan=2)
    
def showLastVerified():
    functionsSetup
    return True

# Balance Labels
labels = [    "Current BOA Balance",    "Current AMEX Card Balance",    "Current Debit Card Balance",    "Current Savings Account Balance",    "Current ETrade Balance",    "Current Tesla Stock Balance",    "Current 401k Balance",    "Current TRowePrice Balance",    "Current Car Loan Balance"]

for i, label_text in enumerate(labels):
    label = tk.Label(window, text=label_text, bg="white", fg="green", width=25)
    label.grid(row=i, column=0, padx=10, pady=10)

# Balance Entries
entries = []
for i in range(len(labels)):
    entry = tk.Entry(window, width=20)
    entry.grid(row=i, column=1)
    entry.insert(0, 1)
    entries.append(entry)

# Outputs
output1 = tk.Label(window, text='Net Worth', font=('Arial', 20))
output1.grid(row=0, column=3, padx=50, pady=10, columnspan=2)

debtOuput = tk.Label(window, text='Current Debt', font=('Arial', 20))
debtOuput.grid(row=3, column=3, padx=50, pady=10, columnspan=2)


# Buttons
calcButton = tk.Button(window, width=20, text="Calculate Changes", command=lambda: updateToNew())
calcButton.grid(row=9, column=0, padx=10, pady=20, columnspan=2)

showButton = tk.Button(window, width=20, text="Show Last Confirmed Changes", command=lambda: showLastVerified())
showButton.grid(row=10, column=0, padx=10, columnspan=2)

window.mainloop()














""" Keeping this in case for some reason it is worth it in the future
window.rowconfigure(0, weight=1)
window.rowconfigure(1, weight=1)
window.rowconfigure(2, weight=1)
window.rowconfigure(3, weight=1)
window.rowconfigure(4, weight=1)
window.rowconfigure(5, weight=1)
window.rowconfigure(6, weight=1)
window.rowconfigure(7, weight=1)
window.rowconfigure(8, weight=1)
window.rowconfigure(9, weight=1)
window.rowconfigure(10, weight=1)
window.columnconfigure(0, weight=1)
window.columnconfigure(1, weight=1)
window.columnconfigure(2, weight=1)
window.columnconfigure(3, weight=1)
window.columnconfigure(4, weight=1)
window.columnconfigure(5, weight=1)
"""
