import sqlite3
import os

root_db = os.path.join(os.getcwd(), 'dev.db')
prisma_db = os.path.join(os.getcwd(), 'prisma', 'dev.db')

print("root dev.db exists:", os.path.exists(root_db))
print("prisma dev.db exists:", os.path.exists(prisma_db))

if os.path.exists(prisma_db):
    conn = sqlite3.connect(prisma_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print("prisma/dev.db tables:", cursor.fetchall())
    conn.close()

if os.path.exists(root_db):
    conn = sqlite3.connect(root_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print("root dev.db tables:", cursor.fetchall())
    conn.close()
