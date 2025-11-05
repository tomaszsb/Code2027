#!/usr/bin/env node
/**
 * Message Cleanup Script
 *
 * Cleanup policy for approved messages:
 * - After 3 days: Move to archive/
 * - After 7 days in archive (10 days total): Delete permanently
 *
 * Pending/Rejected messages are never auto-deleted
 */

const fs = require('fs').promises;
const path = require('path');

const DAYS_TO_ARCHIVE = 3;
const DAYS_TO_DELETE = 7; // Days in archive before deletion
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const claudeInboxDir = path.join(__dirname, 'claude-inbox');
const geminiOutboxDir = path.join(__dirname, 'gemini-outbox');
const archiveDir = path.join(__dirname, 'archive');
const metadataFile = path.join(__dirname, 'message-metadata.json');

async function ensureArchiveDir() {
    await fs.mkdir(archiveDir, { recursive: true });
}

async function loadMetadata() {
    try {
        const data = await fs.readFile(metadataFile, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

async function saveMetadata(metadata) {
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
}

async function getFileAge(filePath) {
    const stats = await fs.stat(filePath);
    return Date.now() - stats.mtime.getTime();
}

async function archiveApprovedMessages() {
    const metadata = await loadMetadata();
    const now = Date.now();
    let archivedCount = 0;

    // Check both directories
    for (const dir of [claudeInboxDir, geminiOutboxDir]) {
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const fileMetadata = metadata[file];

            // Only archive approved messages
            if (fileMetadata && fileMetadata.status === 'approved') {
                const approvedTimestamp = new Date(fileMetadata.timestamp).getTime();
                const daysSinceApproval = (now - approvedTimestamp) / MS_PER_DAY;

                if (daysSinceApproval >= DAYS_TO_ARCHIVE) {
                    // Move to archive
                    const archivePath = path.join(archiveDir, file);
                    await fs.rename(filePath, archivePath);
                    console.log(`Archived: ${file} (${Math.floor(daysSinceApproval)} days old)`);
                    archivedCount++;
                }
            }
        }
    }

    return archivedCount;
}

async function deleteOldArchived() {
    const metadata = await loadMetadata();
    const now = Date.now();
    let deletedCount = 0;
    const updatedMetadata = { ...metadata };

    try {
        const files = await fs.readdir(archiveDir);

        for (const file of files) {
            const filePath = path.join(archiveDir, file);
            const fileAge = await getFileAge(filePath);
            const daysInArchive = fileAge / MS_PER_DAY;

            if (daysInArchive >= DAYS_TO_DELETE) {
                // Delete file and metadata
                await fs.unlink(filePath);
                delete updatedMetadata[file];
                console.log(`Deleted: ${file} (${Math.floor(daysInArchive)} days in archive)`);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            await saveMetadata(updatedMetadata);
        }
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    return deletedCount;
}

async function showStats() {
    const metadata = await loadMetadata();

    const stats = {
        total: Object.keys(metadata).length,
        pending: 0,
        approved: 0,
        rejected: 0
    };

    Object.values(metadata).forEach(m => {
        if (m.status === 'pending') stats.pending++;
        else if (m.status === 'approved') stats.approved++;
        else if (m.status === 'rejected') stats.rejected++;
    });

    console.log('\n📊 Message Statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Approved: ${stats.approved}`);
    console.log(`   Rejected: ${stats.rejected}`);
}

async function main() {
    console.log('🧹 Message Cleanup Started\n');
    console.log(`Policy: Archive approved after ${DAYS_TO_ARCHIVE} days, delete after ${DAYS_TO_DELETE} days in archive\n`);

    try {
        await ensureArchiveDir();

        // Archive old approved messages
        const archived = await archiveApprovedMessages();
        console.log(`\n✅ Archived: ${archived} messages`);

        // Delete very old archived messages
        const deleted = await deleteOldArchived();
        console.log(`✅ Deleted: ${deleted} messages`);

        // Show stats
        await showStats();

        console.log('\n✨ Cleanup Complete\n');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { archiveApprovedMessages, deleteOldArchived };
