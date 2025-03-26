import pandas as pd
import random
import numpy as np
import os

# Original data
names = ['Aditya', 'Vivaan', 'Aarav', 'Meera', 'Diya', 'Riya', 'Ananya', 'Aryan', 'Ishaan', 'Kabir']
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
# Removed night hours (12 AM to 7 AM), only keeping daytime delivery hours
times = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM']
areas = ['Satellite', 'Bopal', 'Vastrapur', 'Paldi', 'Thaltej', 'Navrangpura', 'Bodakdev', 'Gota', 'Maninagar', 'Chandkheda']
sizes = ['Small', 'Medium', 'Large']

# Create expanded dataset with 5000 rows
data = []
entries_per_name = 500  # Each name gets 500 entries (10 names × 500 = 5000 total)
for name in names:
    for _ in range(entries_per_name):
        day = random.choice(days)
        time = random.choice(times)
        area = random.choice(areas)
        size = random.choice(sizes)
        
        # Status with 6% failure rate
        status = 'Fail' if random.random() < 0.06 else 'Success'
        
        data.append([name, day, time, area, size, status])

# Create dataframe
df = pd.DataFrame(data, columns=['Name', 'Day of Delivery Attempt', 'Time', 'Area', 'Package Size', 'Delivery Status'])

# Save to CSV with absolute path
filepath = os.path.join(os.getcwd(), 'dataset.csv')
df.to_csv(filepath, index=False)
print(f"File saved to: {filepath}")

# Print sample and stats
print(f'Dataset generated with {len(df)} rows')
print('\nFirst 5 rows:')
print(df.head())
print('\nDelivery status distribution:')
print(df['Delivery Status'].value_counts(normalize=True).round(4) * 100, '%')
print('\nEntries per name:')
print(df['Name'].value_counts()) 