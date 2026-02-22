-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "duration" TEXT DEFAULT '00:00',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "videoQuality" TEXT DEFAULT 'auto',
    "meetLink" TEXT,
    "liveAt" DATETIME,
    "isLiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lesson" ("courseId", "createdAt", "description", "duration", "id", "isFree", "order", "title", "updatedAt", "videoUrl") SELECT "courseId", "createdAt", "description", "duration", "id", "isFree", "order", "title", "updatedAt", "videoUrl" FROM "Lesson";
DROP TABLE "Lesson";
ALTER TABLE "new_Lesson" RENAME TO "Lesson";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
