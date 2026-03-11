-- CreateTable
CREATE TABLE "User" (
<<<<<<< HEAD
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
=======
    "id" TEXT NOT NULL PRIMARY KEY,
>>>>>>> origin/dev
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "oauthProvider" TEXT,
    "oauthProviderId" TEXT,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
<<<<<<< HEAD
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
=======
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
>>>>>>> origin/dev
);

-- CreateTable
CREATE TABLE "Match" (
<<<<<<< HEAD
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "blackUserId" UUID NOT NULL,
    "whiteUserId" UUID NOT NULL,
    "winnerUserId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
=======
    "id" TEXT NOT NULL PRIMARY KEY,
    "blackUserId" TEXT NOT NULL,
    "whiteUserId" TEXT NOT NULL,
    "winnerUserId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_blackUserId_fkey" FOREIGN KEY ("blackUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_whiteUserId_fkey" FOREIGN KEY ("whiteUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
>>>>>>> origin/dev
);

-- CreateTable
CREATE TABLE "Friendship" (
<<<<<<< HEAD
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requesterUserId" UUID NOT NULL,
    "addresseeUserId" UUID NOT NULL,
    "pairKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
=======
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterUserId" TEXT NOT NULL,
    "addresseeUserId" TEXT NOT NULL,
    "pairKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Friendship_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeUserId_fkey" FOREIGN KEY ("addresseeUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
>>>>>>> origin/dev
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterUserId_addresseeUserId_key" ON "Friendship"("requesterUserId", "addresseeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_pairKey_key" ON "Friendship"("pairKey");
<<<<<<< HEAD

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_blackUserId_fkey" FOREIGN KEY ("blackUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_whiteUserId_fkey" FOREIGN KEY ("whiteUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeUserId_fkey" FOREIGN KEY ("addresseeUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
=======
>>>>>>> origin/dev
