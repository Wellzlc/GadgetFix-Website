#!/usr/bin/env node

/**
 * FAQ Schema Deployment - Rollback Manager
 * Handles emergency rollbacks for FAQ schema deployments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RollbackManager {
  constructor(options = {}) {
    this.deploymentId = options.deploymentId;
    this.phase = options.phase;
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
    
    this.stats = {
      filesRestored: 0,
      filesSkipped: 0,
      errors: 0,
      totalFiles: 0
    };
  }

  async rollback() {
    console.log(`🔄 Starting rollback for deployment ${this.deploymentId}...`);
    console.log(`📊 Phase: ${this.phase}`);
    
    if (this.dryRun) {
      console.log('🧪 DRY RUN MODE - No files will be modified');
    }

    try {
      // 1. Validate backup exists and is complete
      const backupMetadata = await this.validateBackup();
      
      // 2. Create rollback safety backup (current state)
      if (!this.dryRun) {
        await this.createRollbackBackup();
      }
      
      // 3. Restore files from backup
      await this.restoreFiles(backupMetadata);
      
      // 4. Validate restoration
      await this.validateRestoration(backupMetadata);
      
      // 5. Update deployment status
      if (!this.dryRun) {
        await this.updateDeploymentStatus('rolled_back');
      }
      
      this.printSummary();
      
      if (this.stats.errors > 0 && !this.force) {
        throw new Error(`Rollback completed with ${this.stats.errors} errors`);
      }
      
      return this.stats;
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  async validateBackup() {
    console.log('🔍 Validating backup for rollback...');
    
    const backupDir = path.join(process.cwd(), '.deployment-backups', this.deploymentId);
    const metadataPath = path.join(backupDir, 'backup-metadata.json');
    
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory not found: ${this.deploymentId}`);
    }
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Backup metadata not found: ${this.deploymentId}`);
    }
    
    let metadata;
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid backup metadata: ${error.message}`);
    }
    
    // Validate backup integrity
    let missingFiles = 0;
    for (const file of metadata.files) {
      const backupFilePath = path.join(backupDir, file.backupPath);
      if (!fs.existsSync(backupFilePath)) {
        console.log(`❌ Missing backup file: ${file.backupPath}`);
        missingFiles++;
      }
    }
    
    if (missingFiles > 0) {
      if (this.force) {
        console.log(`⚠️  Warning: ${missingFiles} backup files missing (continuing with --force)`);
      } else {
        throw new Error(`Backup incomplete: ${missingFiles} files missing (use --force to continue)`);
      }
    }
    
    console.log(`✅ Backup validated: ${metadata.files.length} files available`);
    this.stats.totalFiles = metadata.files.length;
    
    return metadata;
  }

  async createRollbackBackup() {
    console.log('💾 Creating safety backup of current state...');
    
    const safetyBackupId = `${this.deploymentId}-rollback-safety-${Date.now()}`;
    const safetyBackupDir = path.join(process.cwd(), '.deployment-backups', safetyBackupId);
    
    fs.mkdirSync(safetyBackupDir, { recursive: true });
    
    // Create a quick backup of current state before rollback
    const currentStateFiles = [];
    const locationsDir = path.join(process.cwd(), 'src', 'pages', 'locations');
    
    if (fs.existsSync(locationsDir)) {
      const counties = fs.readdirSync(locationsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const county of counties) {
        const countyDir = path.join(locationsDir, county);
        const safetyCountyDir = path.join(safetyBackupDir, county);
        
        fs.mkdirSync(safetyCountyDir, { recursive: true });
        
        const cityFiles = fs.readdirSync(countyDir)
          .filter(file => file.endsWith('.astro'));
        
        for (const cityFile of cityFiles) {
          const sourcePath = path.join(countyDir, cityFile);
          const safetyPath = path.join(safetyCountyDir, cityFile);
          
          if (fs.existsSync(sourcePath)) {
            const content = fs.readFileSync(sourcePath, 'utf8');
            fs.writeFileSync(safetyPath, content);
            
            currentStateFiles.push({
              originalPath: path.relative(process.cwd(), sourcePath),
              backupPath: path.relative(safetyBackupDir, safetyPath)
            });
          }
        }
      }
    }
    
    // Save safety backup metadata
    const safetyMetadata = {
      deploymentId: this.deploymentId,
      safetyBackupId,
      timestamp: new Date().toISOString(),
      purpose: 'rollback_safety_backup',
      files: currentStateFiles,
      originalRollbackTarget: this.deploymentId
    };
    
    fs.writeFileSync(
      path.join(safetyBackupDir, 'safety-backup-metadata.json'),
      JSON.stringify(safetyMetadata, null, 2)
    );
    
    console.log(`💾 Safety backup created: ${safetyBackupId}`);
    console.log(`📁 Location: ${safetyBackupDir}`);
    console.log(`📊 Backed up ${currentStateFiles.length} current files`);
    
    this.safetyBackupId = safetyBackupId;
  }

  async restoreFiles(backupMetadata) {
    console.log('🔄 Restoring files from backup...');
    
    const backupDir = path.join(process.cwd(), '.deployment-backups', this.deploymentId);
    
    for (const fileInfo of backupMetadata.files) {
      try {
        await this.restoreFile(backupDir, fileInfo);
      } catch (error) {
        console.error(`❌ Failed to restore ${fileInfo.originalPath}: ${error.message}`);
        this.stats.errors++;
      }
    }
  }

  async restoreFile(backupDir, fileInfo) {
    const backupFilePath = path.join(backupDir, fileInfo.backupPath);
    const targetFilePath = path.join(process.cwd(), fileInfo.originalPath);
    
    console.log(`   🔄 Restoring: ${fileInfo.originalPath}`);
    
    // Check if backup file exists
    if (!fs.existsSync(backupFilePath)) {
      if (this.force) {
        console.log(`   ⚠️  Backup file missing (skipping): ${fileInfo.backupPath}`);
        this.stats.filesSkipped++;
        return;
      } else {
        throw new Error(`Backup file not found: ${fileInfo.backupPath}`);
      }
    }
    
    // Check if target directory exists, create if necessary
    const targetDir = path.dirname(targetFilePath);
    if (!fs.existsSync(targetDir)) {
      if (this.dryRun) {
        console.log(`   🧪 Would create directory: ${targetDir}`);
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }
    
    // Read backup content
    const backupContent = fs.readFileSync(backupFilePath, 'utf8');
    
    if (this.dryRun) {
      console.log(`   🧪 Would restore: ${targetFilePath} (${backupContent.length} chars)`);
    } else {
      // Restore the file
      fs.writeFileSync(targetFilePath, backupContent, 'utf8');
      
      // Preserve original timestamp if available
      if (fileInfo.lastModified) {
        try {
          const originalTime = new Date(fileInfo.lastModified);
          fs.utimesSync(targetFilePath, originalTime, originalTime);
        } catch (error) {
          // Timestamp restoration is not critical
        }
      }
    }
    
    this.stats.filesRestored++;
    console.log(`   ✅ Restored: ${fileInfo.originalPath}`);
  }

  async validateRestoration(backupMetadata) {
    console.log('🔍 Validating file restoration...');
    
    let validationErrors = 0;
    
    for (const fileInfo of backupMetadata.files) {
      const targetFilePath = path.join(process.cwd(), fileInfo.originalPath);
      const backupFilePath = path.join(
        process.cwd(), 
        '.deployment-backups', 
        this.deploymentId, 
        fileInfo.backupPath
      );
      
      if (this.dryRun) {
        continue; // Skip validation in dry run mode
      }
      
      try {
        // Check if target file exists
        if (!fs.existsSync(targetFilePath)) {
          console.log(`❌ Validation failed: ${fileInfo.originalPath} not restored`);
          validationErrors++;
          continue;
        }
        
        // Compare content (basic validation)
        const restoredContent = fs.readFileSync(targetFilePath, 'utf8');
        const backupContent = fs.readFileSync(backupFilePath, 'utf8');
        
        if (restoredContent !== backupContent) {
          console.log(`❌ Validation failed: ${fileInfo.originalPath} content mismatch`);
          validationErrors++;
        } else {
          console.log(`   ✅ Validated: ${fileInfo.originalPath}`);
        }
        
      } catch (error) {
        console.log(`❌ Validation error for ${fileInfo.originalPath}: ${error.message}`);
        validationErrors++;
      }
    }
    
    if (validationErrors > 0) {
      if (this.force) {
        console.log(`⚠️  Warning: ${validationErrors} validation errors (continuing with --force)`);
      } else {
        throw new Error(`Restoration validation failed: ${validationErrors} errors`);
      }
    } else {
      console.log('✅ All restored files validated successfully');
    }
  }

  async updateDeploymentStatus(status) {
    console.log(`📊 Updating deployment status to: ${status}`);
    
    try {
      const statusDir = path.join(process.cwd(), '.deployment-status');
      fs.mkdirSync(statusDir, { recursive: true });
      
      const statusFile = path.join(statusDir, `${this.deploymentId}.json`);
      
      let deploymentStatus = {};
      if (fs.existsSync(statusFile)) {
        try {
          deploymentStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        } catch (error) {
          console.log('⚠️  Could not read existing status, creating new one');
        }
      }
      
      deploymentStatus.rollback = {
        status,
        timestamp: new Date().toISOString(),
        phase: this.phase,
        stats: this.stats,
        safetyBackupId: this.safetyBackupId
      };
      
      fs.writeFileSync(statusFile, JSON.stringify(deploymentStatus, null, 2));
      
      console.log(`📋 Status updated: ${statusFile}`);
      
    } catch (error) {
      console.log(`⚠️  Could not update deployment status: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n📊 Rollback Summary:');
    console.log(`   Deployment ID:    ${this.deploymentId}`);
    console.log(`   Phase:            ${this.phase}`);
    console.log(`   Total Files:      ${this.stats.totalFiles}`);
    console.log(`   Files Restored:   ${this.stats.filesRestored}`);
    console.log(`   Files Skipped:    ${this.stats.filesSkipped}`);
    console.log(`   Errors:           ${this.stats.errors}`);
    
    if (this.safetyBackupId) {
      console.log(`   Safety Backup:    ${this.safetyBackupId}`);
    }
    
    const successRate = this.stats.totalFiles > 0 ? 
      ((this.stats.filesRestored / this.stats.totalFiles) * 100).toFixed(1) : 0;
    console.log(`   Success Rate:     ${successRate}%`);
    
    if (this.dryRun) {
      console.log('\n🧪 DRY RUN COMPLETED - No actual changes made');
    } else if (this.stats.errors === 0) {
      console.log('\n✅ Rollback completed successfully!');
    } else {
      console.log(`\n⚠️  Rollback completed with ${this.stats.errors} errors`);
    }
    
    if (this.safetyBackupId) {
      console.log(`\n💾 Safety backup of pre-rollback state saved as: ${this.safetyBackupId}`);
      console.log('   Use this backup if you need to re-apply the rolled back changes');
    }
  }
}

// Utility functions for rollback management
export class RollbackUtils {
  static async listAvailableBackups() {
    const backupsDir = path.join(process.cwd(), '.deployment-backups');
    
    if (!fs.existsSync(backupsDir)) {
      return [];
    }
    
    const backupDirs = fs.readdirSync(backupsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => !name.includes('rollback-safety')); // Exclude safety backups
    
    const backups = [];
    
    for (const backupId of backupDirs) {
      const metadataPath = path.join(backupsDir, backupId, 'backup-metadata.json');
      
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          backups.push({
            deploymentId: backupId,
            timestamp: metadata.timestamp,
            gitCommit: metadata.gitCommit,
            fileCount: metadata.files?.length || 0,
            hasUncommittedChanges: metadata.hasUncommittedChanges
          });
        } catch (error) {
          console.log(`⚠️  Could not read metadata for backup ${backupId}`);
        }
      }
    }
    
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static async getBackupInfo(deploymentId) {
    const backupDir = path.join(process.cwd(), '.deployment-backups', deploymentId);
    const metadataPath = path.join(backupDir, 'backup-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Backup not found: ${deploymentId}`);
    }
    
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--deployment-id=')) {
      options.deploymentId = arg.split('=')[1];
    } else if (arg.startsWith('--phase=')) {
      options.phase = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--list-backups') {
      options.listBackups = true;
    }
  });

  // Handle list backups command
  if (options.listBackups) {
    try {
      const backups = await RollbackUtils.listAvailableBackups();
      
      if (backups.length === 0) {
        console.log('📋 No backups available for rollback');
        return;
      }
      
      console.log('📋 Available backups for rollback:');
      backups.forEach((backup, index) => {
        const date = new Date(backup.timestamp).toLocaleString();
        const commit = backup.gitCommit ? backup.gitCommit.substring(0, 8) : 'unknown';
        console.log(`   ${index + 1}. ${backup.deploymentId}`);
        console.log(`      Date: ${date}`);
        console.log(`      Git: ${commit}`);
        console.log(`      Files: ${backup.fileCount}`);
        console.log(`      Uncommitted: ${backup.hasUncommittedChanges ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      return;
    } catch (error) {
      console.error('❌ Error listing backups:', error.message);
      process.exit(1);
    }
  }

  // Validate required options for rollback
  if (!options.deploymentId || !options.phase) {
    console.error('❌ Missing required options');
    console.error('Usage:');
    console.error('  node rollback.js --deployment-id=<id> --phase=<phase> [--dry-run] [--force]');
    console.error('  node rollback.js --list-backups');
    console.error('');
    console.error('Examples:');
    console.error('  node rollback.js --deployment-id=faq-deploy-20250113-143022-phase1 --phase=phase1');
    console.error('  node rollback.js --deployment-id=faq-deploy-20250113-143022-phase1 --phase=phase1 --dry-run');
    console.error('  node rollback.js --list-backups');
    process.exit(1);
  }

  try {
    const rollbackManager = new RollbackManager(options);
    const stats = await rollbackManager.rollback();
    
    console.log(`🎉 Rollback for ${options.deploymentId} completed!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}