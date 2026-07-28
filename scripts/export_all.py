import sqlite3
import csv
import os

db_path = os.path.join('prisma', 'dev.db')
output_csv = 'all_results.csv'

print("Exporting data from SQLite to CSV...")
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute('SELECT seat_number, name, percentage, result FROM results')

with open(output_csv, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    writer.writerow(['رقم الجلوس', 'اسم الطالب', 'النسبة المئوية', 'النتيجة'])
    
    count = 0
    while True:
        rows = c.fetchmany(50000)
        if not rows:
            break
        writer.writerows(rows)
        count += len(rows)
        print(f"Exported {count} records...")

conn.close()
print(f"Done! All {count} records exported successfully to {output_csv}")
