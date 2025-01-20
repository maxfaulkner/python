#Calculates the find value 
def calculate_compound_interest(p,r,n,t):
    return (p*((1+(r/n))**(n*t)))

#Calculates the compounded value for each year 
def calculate_compound_interest_over_time (p,r,n,t):
    total_for_given_time = []
    for time in range(int(t)):
        total = (p*((1+(r/n))**(n*time)))
        total_for_given_time.append([time,total])
    return(total_for_given_time)


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
        