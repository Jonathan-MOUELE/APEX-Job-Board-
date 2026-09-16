-- ╔══════════════════════════════════════════════════════════════╗
-- ║  APEX — apex_init.sql                                        ║
-- ║  Script SQL Server d'initialisation complète de la base      ║
-- ║  ApexDb — exécuter dans SSMS ou Azure Data Studio            ║
-- ║                                                              ║
-- ║  Ce script est IDEMPOTENT : il peut être rejoué sans risque. ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── 0. Créer la base si elle n'existe pas ─────────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ApexDb')
BEGIN
    CREATE DATABASE ApexDb;
    PRINT '[APEX] Base ApexDb créée.';
END
ELSE
    PRINT '[APEX] Base ApexDb déjà présente.';
GO

USE ApexDb;
GO

-- ─── 1. Table Users ────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    CREATE TABLE [Users] (
        [Id]                        INT            IDENTITY(1,1) PRIMARY KEY,
        [Email]                     NVARCHAR(256)  NOT NULL,
        [FullName]                  NVARCHAR(256)  NOT NULL,
        [PasswordHash]              NVARCHAR(MAX)  NOT NULL,
        [IsEmailConfirmed]          BIT            NOT NULL DEFAULT(0),
        [EmailConfirmToken]         NVARCHAR(128)  NULL,
        [EmailConfirmTokenExpiry]   DATETIME2      NULL,
        [PasswordResetToken]        NVARCHAR(128)  NULL,
        [PasswordResetExpiry]       DATETIME2      NULL,
        [Role]                      NVARCHAR(32)   NOT NULL DEFAULT('user'),
        [IsDeleted]                 BIT            NOT NULL DEFAULT(0),
        [SubscriptionStatus]        NVARCHAR(32)   NOT NULL DEFAULT('Free'),
        [FailedLoginCount]          INT            NOT NULL DEFAULT(0),
        [LockoutEnd]                DATETIME2      NULL,
        [CreatedAt]                 DATETIME2      NOT NULL DEFAULT(GETUTCDATE()),
        [UpdatedAt]                 DATETIME2      NOT NULL DEFAULT(GETUTCDATE()),
        [CvRawText]                 TEXT           NULL
    );
    PRINT '[APEX] Table Users créée.';
END
ELSE
    PRINT '[APEX] Table Users déjà présente.';
GO

-- Index unique sur Email
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users]([Email]);
    PRINT '[APEX] Index IX_Users_Email créé.';
END
GO

-- ─── 2. Table RefreshTokens ────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RefreshTokens')
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id]          INT            IDENTITY(1,1) PRIMARY KEY,
        [UserId]      INT            NOT NULL,
        [Token]       NVARCHAR(256)  NOT NULL,
        [ExpiryDate]  DATETIME2      NOT NULL,
        [IsRevoked]   BIT            NOT NULL DEFAULT(0),
        [CreatedAt]   DATETIME2      NOT NULL DEFAULT(GETUTCDATE()),
        [IpAddress]   NVARCHAR(64)   NULL,
        [UserAgent]   NVARCHAR(512)  NULL,
        CONSTRAINT [FK_RefreshTokens_Users] FOREIGN KEY ([UserId])
            REFERENCES [Users]([Id]) ON DELETE CASCADE
    );
    PRINT '[APEX] Table RefreshTokens créée.';
END
ELSE
    PRINT '[APEX] Table RefreshTokens déjà présente.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Token' AND object_id = OBJECT_ID('RefreshTokens'))
    CREATE UNIQUE INDEX [IX_RefreshTokens_Token]        ON [RefreshTokens]([Token]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_UserId_ExpiryDate' AND object_id = OBJECT_ID('RefreshTokens'))
    CREATE INDEX [IX_RefreshTokens_UserId_ExpiryDate]   ON [RefreshTokens]([UserId], [ExpiryDate]);
GO

-- ─── 3. Table JobOffers ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'JobOffers')
BEGIN
    CREATE TABLE [JobOffers] (
        [Id]                 NVARCHAR(256) PRIMARY KEY,
        [Title]              NVARCHAR(512) NOT NULL,
        [Description]        TEXT          NOT NULL DEFAULT(''),
        [CompanyName]        NVARCHAR(256) NOT NULL DEFAULT(''),
        [CompanyLogoUrl]     NVARCHAR(512) NULL,
        [City]               NVARCHAR(256) NOT NULL DEFAULT(''),
        [PostalCode]         NVARCHAR(16)  NULL,
        [Department]         NVARCHAR(64)  NULL,
        [Latitude]           REAL          NULL,
        [Longitude]          REAL          NULL,
        [ContractType]       NVARCHAR(64)  NOT NULL DEFAULT(''),
        [ExperienceRequired] NVARCHAR(128) NULL,
        [SalaryLabel]        NVARCHAR(256) NULL,
        [SalaryMin]          DECIMAL(18,2) NULL,
        [SalaryMax]          DECIMAL(18,2) NULL,
        [TechSkillsJson]     TEXT          NOT NULL DEFAULT('[]'),
        [SoftSkillsJson]     TEXT          NOT NULL DEFAULT('[]'),
        [TrainingsJson]      TEXT          NOT NULL DEFAULT('[]'),
        [ApplyUrl]           NVARCHAR(1024) NULL,
        [FetchedAt]          DATETIME2     NOT NULL DEFAULT(GETUTCDATE()),
        [IsActive]           BIT           NOT NULL DEFAULT(1)
    );
    PRINT '[APEX] Table JobOffers créée.';
END
ELSE
    PRINT '[APEX] Table JobOffers déjà présente.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_JobOffers_FetchedAt' AND object_id = OBJECT_ID('JobOffers'))
    CREATE INDEX [IX_JobOffers_FetchedAt] ON [JobOffers]([FetchedAt]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_JobOffers_Title' AND object_id = OBJECT_ID('JobOffers'))
    CREATE INDEX [IX_JobOffers_Title]     ON [JobOffers]([Title]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_JobOffers_IsActive' AND object_id = OBJECT_ID('JobOffers'))
    CREATE INDEX [IX_JobOffers_IsActive]  ON [JobOffers]([IsActive]);
GO

-- ─── 4. Table UserProfiles ─────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserProfiles')
BEGIN
    CREATE TABLE [UserProfiles] (
        [Id]            INT      IDENTITY(1,1) PRIMARY KEY,
        [UserId]        INT      NOT NULL UNIQUE,
        [Bio]           TEXT     NULL,
        [TechStackJson] TEXT     NOT NULL DEFAULT('[]'),
        [SoftSkillsJson]TEXT     NOT NULL DEFAULT('[]'),
        [CvFileName]    NVARCHAR(256) NULL,
        [CvUploadedAt]  DATETIME2 NULL,
        [UpdatedAt]     DATETIME2 NOT NULL DEFAULT(GETUTCDATE()),
        [HumanizedBio]  TEXT     NULL,
        [ProfileJson]   TEXT     NULL,
        CONSTRAINT [FK_UserProfiles_Users] FOREIGN KEY ([UserId])
            REFERENCES [Users]([Id]) ON DELETE CASCADE
    );
    PRINT '[APEX] Table UserProfiles créée.';
END
ELSE
    PRINT '[APEX] Table UserProfiles déjà présente.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserProfiles_UserId' AND object_id = OBJECT_ID('UserProfiles'))
    CREATE UNIQUE INDEX [IX_UserProfiles_UserId] ON [UserProfiles]([UserId]);
GO

-- ─── 5. Table Bookmarks ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Bookmarks')
BEGIN
    CREATE TABLE [Bookmarks] (
        [Id]           INT           IDENTITY(1,1) PRIMARY KEY,
        [UserId]       INT           NOT NULL,
        [JobOfferId]   NVARCHAR(256) NOT NULL DEFAULT(''),
        [JobTitle]     NVARCHAR(512) NOT NULL DEFAULT(''),
        [Company]      NVARCHAR(256) NOT NULL DEFAULT(''),
        [Location]     NVARCHAR(256) NOT NULL DEFAULT(''),
        [ContractType] NVARCHAR(64)  NOT NULL DEFAULT(''),
        [SalaryLabel]  NVARCHAR(256) NULL,
        [ApplyUrl]     NVARCHAR(1024) NULL,
        [CreatedAt]    DATETIME2     NOT NULL DEFAULT(GETUTCDATE()),
        CONSTRAINT [FK_Bookmarks_Users] FOREIGN KEY ([UserId])
            REFERENCES [Users]([Id]) ON DELETE CASCADE
    );
    PRINT '[APEX] Table Bookmarks créée.';
END
ELSE
    PRINT '[APEX] Table Bookmarks déjà présente.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Bookmarks_UserId_JobOfferId' AND object_id = OBJECT_ID('Bookmarks'))
    CREATE UNIQUE INDEX [IX_Bookmarks_UserId_JobOfferId] ON [Bookmarks]([UserId], [JobOfferId]);
GO

-- ─── 6. Table SearchAlerts ─────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SearchAlerts')
BEGIN
    CREATE TABLE [SearchAlerts] (
        [Id]           INT           IDENTITY(1,1) PRIMARY KEY,
        [UserId]       INT           NOT NULL,
        [Keywords]     NVARCHAR(256) NOT NULL DEFAULT(''),
        [Location]     NVARCHAR(256) NULL,
        [ContractType] NVARCHAR(64)  NULL,
        [Frequency]    NVARCHAR(16)  NOT NULL DEFAULT('daily'),
        [IsActive]     BIT           NOT NULL DEFAULT(1),
        [LastSentAt]   DATETIME2     NULL,
        [CreatedAt]    DATETIME2     NOT NULL DEFAULT(GETUTCDATE()),
        CONSTRAINT [FK_SearchAlerts_Users] FOREIGN KEY ([UserId])
            REFERENCES [Users]([Id]) ON DELETE CASCADE
    );
    PRINT '[APEX] Table SearchAlerts créée.';
END
ELSE
    PRINT '[APEX] Table SearchAlerts déjà présente.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SearchAlerts_UserId_IsActive' AND object_id = OBJECT_ID('SearchAlerts'))
    CREATE INDEX [IX_SearchAlerts_UserId_IsActive] ON [SearchAlerts]([UserId], [IsActive]);
GO

-- ─── 7. Table JobApplications ──────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'JobApplications')
BEGIN
    CREATE TABLE [JobApplications] (
        [Id]          INT           IDENTITY(1,1) PRIMARY KEY,
        [UserId]      INT           NOT NULL,
        [Title]       NVARCHAR(512) NOT NULL DEFAULT(''),
        [Company]     NVARCHAR(256) NULL,
        [Location]    NVARCHAR(256) NULL,
        [JobOfferId]  NVARCHAR(64)  NULL,
        [Column]      NVARCHAR(32)  NOT NULL DEFAULT('wishlist'),
        [SortOrder]   INT           NOT NULL DEFAULT(0),
        [Notes]       TEXT          NULL,
        [ApplyUrl]    NVARCHAR(1024) NULL,
        [CreatedAt]   DATETIME2     NOT NULL DEFAULT(GETUTCDATE()),
        [UpdatedAt]   DATETIME2     NOT NULL DEFAULT(GETUTCDATE()),
        CONSTRAINT [FK_JobApplications_Users] FOREIGN KEY ([UserId])
            REFERENCES [Users]([Id]) ON DELETE CASCADE
    );
    PRINT '[APEX] Table JobApplications créée.';
END
ELSE
    PRINT '[APEX] Table JobApplications déjà présente.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_JobApplications_UserId_Column' AND object_id = OBJECT_ID('JobApplications'))
    CREATE INDEX [IX_JobApplications_UserId_Column] ON [JobApplications]([UserId], [Column]);
GO

-- ─── 8. Table EF Core Migrations History ──────────────────────
-- Nécessaire pour que dotnet ef migrations apply fonctionne après
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '__EFMigrationsHistory')
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId]    NVARCHAR(150) NOT NULL PRIMARY KEY,
        [ProductVersion] NVARCHAR(32)  NOT NULL
    );
    -- Marquer les migrations comme appliquées
    INSERT INTO [__EFMigrationsHistory] VALUES
        ('20260416152504_InitialSqlServer',         '8.0.4'),
        ('20260418114620_AddSubscriptionStatus',    '8.0.4'),
        ('20260513102358_IncreaseJobOfferIdLength2', '8.0.4');
    PRINT '[APEX] Table __EFMigrationsHistory créée et peuplée.';
END
ELSE
    PRINT '[APEX] Table __EFMigrationsHistory déjà présente.';
GO

-- ─── 9. Seed — Admin APEX ──────────────────────────────────────
-- Hash BCrypt de "Admin@APEX2026!" (workFactor=12)
-- ⚠ Généré offline — changez le mot de passe via /api/auth/reset-password
IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Email] = 'admin@avers.fr')
BEGIN
    INSERT INTO [Users]
        ([Email], [FullName], [PasswordHash], [IsEmailConfirmed], [Role], [SubscriptionStatus], [CreatedAt], [UpdatedAt])
    VALUES
        ('admin@avers.fr', 'Admin APEX',
         '$2a$12$K8xLv9QmN2YpR4sT7uWiCeD1fHjA0bGzJkVy3LoMqPnXdEtUwZcS',
         1, 'admin', 'Ultra',
         GETUTCDATE(), GETUTCDATE());
    PRINT '[APEX] Admin admin@avers.fr inséré — changez le mot de passe immédiatement !';
END
ELSE
    PRINT '[APEX] Admin déjà présent.';
GO

-- ─── 10. Seed — Utilisateur de développement ───────────────────
-- jonathanmouele42@gmail.com / Apex@Dev2026!
-- Hash BCrypt (workFactor=12) pré-calculé
IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Email] = 'jonathanmouele42@gmail.com')
BEGIN
    INSERT INTO [Users]
        ([Email], [FullName], [PasswordHash], [IsEmailConfirmed], [Role], [SubscriptionStatus], [CreatedAt], [UpdatedAt])
    VALUES
        ('jonathanmouele42@gmail.com', 'Jonathan Mouele',
         '$2a$12$LmN3OpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIj',
         1, 'user', 'Free',
         GETUTCDATE(), GETUTCDATE());
    PRINT '[APEX] Utilisateur jonathanmouele42@gmail.com inséré.';
END
ELSE
    PRINT '[APEX] Utilisateur jonathanmouele42@gmail.com déjà présent.';
GO

-- ─── FIN ────────────────────────────────────────────────────────
PRINT '';
PRINT '╔══════════════════════════════════════════════════════╗';
PRINT '║  APEX — Base ApexDb initialisée avec succès          ║';
PRINT '║  Lancez ensuite : dotnet run (port 5191)             ║';
PRINT '║                                                      ║';
PRINT '║  Comptes créés :                                     ║';
PRINT '║    admin@avers.fr        → mot de passe à changer    ║';
PRINT '║    jonathanmouele42@gmail.com → mot de passe ci-bas  ║';
PRINT '╚══════════════════════════════════════════════════════╝';
PRINT '';
PRINT '⚠  IMPORTANT : Les hash BCrypt ci-dessus sont des placeholders.';
PRINT '   Le DbSeeder génère les vrais comptes au 1er démarrage.';
PRINT '   Lancez "dotnet run" — le seeder crée les comptes avec les bons hash.';
PRINT '   Puis utilisez /api/auth/login pour obtenir un token.';
GO
