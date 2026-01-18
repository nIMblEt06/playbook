-- CreateEnum
CREATE TYPE "AvatarType" AS ENUM ('custom', 'pixel');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('album', 'track', 'artist');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('genre', 'mood', 'era', 'custom');

-- CreateEnum
CREATE TYPE "PlaylistSource" AS ENUM ('spotify', 'apple_music', 'youtube_music', 'soundcloud');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'upvote_review';
ALTER TYPE "NotificationType" ADD VALUE 'review_comment';
ALTER TYPE "NotificationType" ADD VALUE 'review_reply';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TargetType" ADD VALUE 'review';
ALTER TYPE "TargetType" ADD VALUE 'review_comment';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "linkMetadata" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarType" "AvatarType" NOT NULL DEFAULT 'custom',
ADD COLUMN     "pixelAvatarId" INTEGER;

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "musicbrainzId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortName" TEXT,
    "imageUrl" TEXT,
    "country" TEXT,
    "type" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "ratingSum" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "musicbrainzId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "artistId" TEXT,
    "releaseDate" TIMESTAMP(3),
    "releaseYear" INTEGER,
    "coverImageUrl" TEXT,
    "trackCount" INTEGER,
    "albumType" TEXT NOT NULL DEFAULT 'album',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "ratingSum" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "musicbrainzId" TEXT,
    "title" TEXT NOT NULL,
    "albumId" TEXT,
    "artistName" TEXT NOT NULL,
    "trackNumber" INTEGER,
    "discNumber" INTEGER DEFAULT 1,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "albumId" TEXT,
    "trackId" TEXT,
    "artistId" TEXT,
    "rating" INTEGER,
    "title" VARCHAR(200),
    "content" VARCHAR(5000),
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" VARCHAR(2000) NOT NULL,
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "albumId" TEXT,
    "trackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL DEFAULT 'genre',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumTag" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistPreview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "PlaylistSource" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerName" TEXT,
    "coverImageUrl" TEXT,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistPreview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_musicbrainzId_key" ON "Artist"("musicbrainzId");

-- CreateIndex
CREATE INDEX "Artist_name_idx" ON "Artist"("name");

-- CreateIndex
CREATE INDEX "Artist_musicbrainzId_idx" ON "Artist"("musicbrainzId");

-- CreateIndex
CREATE UNIQUE INDEX "Album_musicbrainzId_key" ON "Album"("musicbrainzId");

-- CreateIndex
CREATE INDEX "Album_title_idx" ON "Album"("title");

-- CreateIndex
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");

-- CreateIndex
CREATE INDEX "Album_musicbrainzId_idx" ON "Album"("musicbrainzId");

-- CreateIndex
CREATE INDEX "Album_releaseYear_idx" ON "Album"("releaseYear");

-- CreateIndex
CREATE UNIQUE INDEX "Track_musicbrainzId_key" ON "Track"("musicbrainzId");

-- CreateIndex
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");

-- CreateIndex
CREATE INDEX "Track_musicbrainzId_idx" ON "Track"("musicbrainzId");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE INDEX "Review_albumId_idx" ON "Review"("albumId");

-- CreateIndex
CREATE INDEX "Review_trackId_idx" ON "Review"("trackId");

-- CreateIndex
CREATE INDEX "Review_artistId_idx" ON "Review"("artistId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "Review_upvoteCount_idx" ON "Review"("upvoteCount");

-- CreateIndex
CREATE UNIQUE INDEX "Review_authorId_albumId_key" ON "Review"("authorId", "albumId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_authorId_trackId_key" ON "Review"("authorId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_authorId_artistId_key" ON "Review"("authorId", "artistId");

-- CreateIndex
CREATE INDEX "ReviewComment_reviewId_idx" ON "ReviewComment"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewComment_authorId_idx" ON "ReviewComment"("authorId");

-- CreateIndex
CREATE INDEX "ReviewComment_parentId_idx" ON "ReviewComment"("parentId");

-- CreateIndex
CREATE INDEX "ReviewComment_createdAt_idx" ON "ReviewComment"("createdAt");

-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

-- CreateIndex
CREATE INDEX "Rating_albumId_idx" ON "Rating"("albumId");

-- CreateIndex
CREATE INDEX "Rating_trackId_idx" ON "Rating"("trackId");

-- CreateIndex
CREATE INDEX "Rating_value_idx" ON "Rating"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_albumId_key" ON "Rating"("userId", "albumId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_trackId_key" ON "Rating"("userId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_category_idx" ON "Tag"("category");

-- CreateIndex
CREATE INDEX "Tag_useCount_idx" ON "Tag"("useCount");

-- CreateIndex
CREATE INDEX "AlbumTag_albumId_idx" ON "AlbumTag"("albumId");

-- CreateIndex
CREATE INDEX "AlbumTag_tagId_idx" ON "AlbumTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumTag_albumId_tagId_key" ON "AlbumTag"("albumId", "tagId");

-- CreateIndex
CREATE INDEX "PostTag_postId_idx" ON "PostTag"("postId");

-- CreateIndex
CREATE INDEX "PostTag_tagId_idx" ON "PostTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "PostTag_postId_tagId_key" ON "PostTag"("postId", "tagId");

-- CreateIndex
CREATE INDEX "PlaylistPreview_userId_idx" ON "PlaylistPreview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistPreview_sourceType_sourceId_key" ON "PlaylistPreview"("sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "upvote_review_fk" FOREIGN KEY ("targetId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "upvote_review_comment_fk" FOREIGN KEY ("targetId") REFERENCES "ReviewComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ReviewComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumTag" ADD CONSTRAINT "AlbumTag_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumTag" ADD CONSTRAINT "AlbumTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumTag" ADD CONSTRAINT "AlbumTag_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistPreview" ADD CONSTRAINT "PlaylistPreview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
