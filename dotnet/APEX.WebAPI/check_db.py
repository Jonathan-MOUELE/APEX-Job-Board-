import sqlite3
db = sqlite3.connect('apex.db')
db.execute("INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260403094918_InitialSqlite', '9.0.3')")
db.commit()
hist = db.execute("SELECT MigrationId FROM __EFMigrationsHistory").fetchall()
print("Migrations:", [h[0] for h in hist])
db.close()
