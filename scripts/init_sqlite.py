import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'prisma', 'dev.db')
print("Initializing SQLite database at:", db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.executescript("""
CREATE TABLE IF NOT EXISTS "results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "seat_number" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "system_stats" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "last_imported_file" TEXT,
    "last_import_date" DATETIME
);

CREATE INDEX IF NOT EXISTS "results_seat_number_idx" ON "results"("seat_number");
CREATE INDEX IF NOT EXISTS "results_normalized_name_idx" ON "results"("normalized_name");
""")

conn.commit()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables in database:", cursor.fetchall())

conn.close()
