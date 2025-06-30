/*
  Warnings:

  - You are about to drop the column `currentPrice` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `initialPrice` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdated` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `lowerThreshold` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `stockSymbol` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `upperThreshold` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Watchlist` table. All the data in the column will be lost.
  - Added the required column `current_price` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initial_price` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lower_threshold` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock_symbol` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upper_threshold` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Watchlist` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "stock_symbol" TEXT NOT NULL,
    "upper_threshold" REAL NOT NULL,
    "lower_threshold" REAL NOT NULL,
    "current_price" REAL NOT NULL,
    "initial_price" REAL NOT NULL,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Watchlist" ("id", "user_id", "stock_symbol", "upper_threshold", "lower_threshold", "current_price", "initial_price", "last_updated") SELECT "id", "userId", "stockSymbol", "upperThreshold", "lowerThreshold", "currentPrice", "initialPrice", "lastUpdated" FROM "Watchlist";
DROP TABLE "Watchlist";
ALTER TABLE "new_Watchlist" RENAME TO "Watchlist";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
