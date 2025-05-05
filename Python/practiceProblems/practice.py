def total_overs(balls):
    ballsFinal = balls%6
    overs = balls//6

    return float(f"{overs}.{ballsFinal}")

print(total_overs(164))