-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubjectGrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportCardId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "normalizedSubject" TEXT,
    "gradeType" TEXT NOT NULL DEFAULT 'percentage',
    "rawGrade" TEXT NOT NULL,
    "percentage" REAL,
    "letterGrade" TEXT,
    "includeInAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubjectGrade_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_userId_schoolYear_term_grade_key" ON "ReportCard"("userId", "schoolYear", "term", "grade");
