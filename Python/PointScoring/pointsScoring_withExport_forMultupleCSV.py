import os
import pandas as pd

# Points per position
POINTS = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1
}

def process_csv_files(directory, output_file):
    # List all CSV files in the directory
    files = [f for f in os.listdir(directory) if f.endswith('.csv')]

    # Create DataFrame to hold all data
    all_data = pd.DataFrame()

    # Create dict to store total points
    total_points = {}

    for file in files:
        df = pd.read_csv(os.path.join(directory, file))

        # New DataFrame for the modified data
        df_new = pd.DataFrame(columns=['Team', 'Points'])

        # Temporary dict to store highest points in current race
        race_points = {}

        for index, row in df.iterrows():
            team = row['Name']
            position_in_class = row['PIC']

            # Get the points for this position (if the position is in the POINTS dictionary)
            points = POINTS.get(position_in_class, 0)

            # Update race_points if points are higher than current highest for the team
            if points > race_points.get(team, 0):
                race_points[team] = points

            # Add the team and points to the new DataFrame
            df_new.loc[index] = [team, points]

        # Update total_points with highest points from current race
        for team, points in race_points.items():
            if points > total_points.get(team, 0):
                total_points[team] = points

        # Rename columns to denote the race (file) they belong to
        df_new.columns = [f"{file[:-4]} - {col}" for col in df_new.columns]

        # Add the new DataFrame to the all_data DataFrame
        all_data = pd.concat([all_data, df_new, pd.DataFrame(columns=[' '])], axis=1)

    # Add total points as the final column
    all_data = pd.concat([all_data, pd.DataFrame(total_points.items(), columns=['Team', 'Total Points'])], axis=1)

    # Save the all_data DataFrame as a CSV file
    all_data.to_csv(output_file, index=False)


directory = 'C:/Users/faulk/Documents/python/Python/PointScoring'  # replace this with your directory path
output_file = 'C:/Users/faulk/Documents/python/Python/PointScoring/Output/output.csv'
process_csv_files(directory, output_file)

