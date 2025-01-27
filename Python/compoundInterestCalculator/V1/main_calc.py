#Calculates final total with no contributions 
def calculate_compound_interest(p,r,n,t):
    return (p*((1+(r/n))**(n*t)))

#Calculates final total with contributions 
def calculate_compound_interest_with_contributions(p,r,n,t,c):
    firstHalf = p*((1+(r/n))**(n*t))
    secondHalf = c * ((1 + r / n) ** (n * t) - 1) / (r / n)
    total = firstHalf+secondHalf
    return total

#Calculates the compounded value for each year 
def calculate_compound_interest_over_time (p,r,n,t):
    total_for_given_time = []
    for time in range(int(t)):
        total = (p*((1+(r/n))**(n*time)))
        total_for_given_time.append([time,total])
    return(total_for_given_time)

def  calculate_compound_interest_over_time_with_contributions(p,r,n,t,c):
    value_at_each_time = []
    for time in range(int(t)):
        firstHalf = p*((1+(r/n))**(n*time))
        secondHalf = c * ((1 + r / n) ** (n * time) - 1) / (r / n)
        total = firstHalf + secondHalf
        value_at_each_time.append([time,total])
    return value_at_each_time


def calculate_varying_interest_over_time (p,r,n,t):
    rates = [r - .02, r - .01, r + .01, r + .02]
    results = {}
    for rate in rates:
        total = []
        for time in range(int(t)):
            final_amount = (p*((1+(rate/n))**(n*time)))
            total.append((time, final_amount))
        results[rate] = total
    return results
        
def calculate_varying_interest_with_contributions(p,r,n,t,c):
    rates = [r - .02, r - .01, r + .01, r + .02]
    results = {}
    for rate in rates:
        total = []
        for time in range(int(t)):
            firstHalf = p*((1+(rate/n))**(n*time))
            secondHalf = c * (((1 + rate / n) ** (n * time) - 1) / (rate / n))
            final_amount =  firstHalf + secondHalf
            total.append((time, final_amount))
        results[rate] = total
    return results