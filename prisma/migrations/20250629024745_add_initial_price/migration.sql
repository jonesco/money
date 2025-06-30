/*
  Warnings:

  - Added the required column `initialPrice` to the `Watchlist` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "upperThreshold" REAL NOT NULL,
    "lowerThreshold" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "initialPrice" REAL NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Watchlist" ("currentPrice", "id", "lastUpdated", "lowerThreshold", "stockSymbol", "upperThreshold", "userId", "initialPrice") SELECT "currentPrice", "id", "lastUpdated", "lowerThreshold", "stockSymbol", "upperThreshold", "userId", "currentPrice" FROM "Watchlist";
DROP TABLE "Watchlist";
ALTER TABLE "new_Watchlist" RENAME TO "Watchlist";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
