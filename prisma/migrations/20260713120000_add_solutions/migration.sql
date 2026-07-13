CREATE TYPE "SolutionType" AS ENUM ('SERVICE', 'SECTOR');

CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "type" "SolutionType" NOT NULL DEFAULT 'SERVICE',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroDescription" TEXT,
    "heroMedia" JSONB,
    "icon" TEXT,
    "overview" TEXT,
    "challenges" JSONB,
    "capabilities" JSONB,
    "process" JSONB,
    "differentiators" JSONB,
    "useCases" JSONB,
    "outcomes" JSONB,
    "faqs" JSONB,
    "visualGallery" JSONB,
    "gallery" JSONB,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Solution_slug_key" ON "Solution"("slug");
CREATE INDEX "Solution_type_idx" ON "Solution"("type");
CREATE INDEX "Solution_status_idx" ON "Solution"("status");
CREATE INDEX "Solution_sortOrder_idx" ON "Solution"("sortOrder");
CREATE INDEX "Solution_slug_idx" ON "Solution"("slug");
