
"""
What do we want this to do?
- return overall net worth
- return change in balances from previous month(click?)
- write new month to an excel sheet 

- Future
    - Plot growth of everything
    - dropdown/checkboxes to choose the different things to plot

What do I need from outside?
- balances from excel sheet of previous months
- current balances from tkiter script


"""


def calculate (credit,amex,debit,savings,etrade,tesla,k401,trow,carLoan):
    netWorth = int(debit) + int(savings)+int(etrade)+int(tesla)+int(k401)+int(trow) - int(carLoan) - int(credit) - int(amex)
    currentDebt = int(carLoan) + int(credit) + int(amex) 
    return (netWorth, currentDebt)

