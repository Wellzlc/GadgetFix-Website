#!/usr/bin/env node

/**
 * FAQ Schema Deployment - Backup Creation
 * Creates comprehensive backups before deployment for rollback capability
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BackupManager {
  constructor(deploymentId) {
    this.deploymentId = deploymentId;
    this.backupDir = path.join(process.cwd(), '.deployment-backups', deploymentId);
    this.metadata = {
      deploymentId,
      timestamp: new Date().toISOString(),
      backupVersion: '1.0',
      files: [],
      gitCommit: null,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  async createBackup() {
    console.log(`💾 Creating deployment backup for ${this.deploymentId}...`);
    
    try {
      // 1. Create backup directory structure
      await this.setupBackupDirectory();
      
      // 2. Get current git commit
      await this.captureGitCommit();
      
      // 3. Backup all location pages
      await this.backupLocationPages();
      
      // 4. Backup related components and configs
      await this.backupComponents();
      
      // 5. Create deployment metadata
      await this.saveMetadata();
      
      console.log(`✅ Backup created successfully: ${this.backupDir}`);
      console.log(`📊 Backed up ${this.metadata.files.length} files`);
      
      return this.metadata;
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error.message);
      throw error;
    }
  }

  async setupBackupDirectory() {
    // Create main backup directory
    fs.mkdirSync(this.backupDir, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['pages', 'components', 'configs', 'git'];
    subdirs.forEach(subdir => {
      fs.mkdirSync(path.join(this.backupDir, subdir), { recursive: true });
    });
    
    console.log(`📁 Backup directory created: ${this.backupDir}`);
  }

  async captureGitCommit() {
    try {
      // Get current git commit hash
      const { execSync } = await import('child_process');
      
      const gitCommit = execSync('git rev-parse HEAD', { 
        encoding: 'utf8',
        cwd: process.cwd()
      }).trim();
      
      const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
        cwd: process.cwd()
      }).trim();
      
      const gitStatus = execSync('git status --porcelain', {
        encoding: 'utf8',
        cwd: process.cwd()
      }).trim();
      
      this.metadata.gitCommit = gitCommit;
      this.metadata.gitBranch = gitBranch;
      this.metadata.hasUncommittedChanges = gitStatus.length > 0;
      
      // Save git info to backup
      const gitInfo = {
        commit: gitCommit,
        branch: gitBranch,
        timestamp: new Date().toISOString(),
        uncommittedChanges: gitStatus.split('\n').filter(line => line.trim())
      };
      
      fs.writeFileSync(
        path.join(this.backupDir, 'git', 'git-info.json'),
        JSON.stringify(gitInfo, null, 2)
      );
      
      console.log(`📝 Git state captured: ${gitBranch}@${gitCommit.substring(0, 8)}`);
      
      if (gitStatus.length > 0) {
        console.log(`⚠️  Warning: ${gitStatus.split('\n').length} uncommitted changes detected`);
      }
      
    } catch (error) {
      console.log(`⚠️  Could not capture git state: ${error.message}`);
      this.metadata.gitCommit = 'unknown';
    }
  }

  async backupLocationPages() {
    console.log('📄 Backing up location pages...');
    
    const locationsDir = path.join(process.cwd(), 'src', 'pages', 'locations');
    
    if (!fs.existsSync(locationsDir)) {
      throw new Error('Locations directory not found');
    }
    
    const counties = fs.readdirSync(locationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    let fileCount = 0;
    
    for (const county of counties) {
      const countyDir = path.join(locationsDir, county);
      const backupCountyDir = path.join(this.backupDir, 'pages', county);
      
      // Create county backup directory
      fs.mkdirSync(backupCountyDir, { recursive: true });
      
      const cityFiles = fs.readdirSync(countyDir)
        .filter(file => file.endsWith('.astro'));
      
      for (const cityFile of cityFiles) {
        const sourcePath = path.join(countyDir, cityFile);
        const backupPath = path.join(backupCountyDir, cityFile);
        
        // Copy file with metadata
        const content = fs.readFileSync(sourcePath, 'utf8');
        const stats = fs.statSync(sourcePath);
        
        fs.writeFileSync(backupPath, content);
        
        // Record file metadata
        this.metadata.files.push({
          originalPath: path.relative(process.cwd(), sourcePath),
          backupPath: path.relative(this.backupDir, backupPath),
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          hasExistingSchema: this.checkExistingSchema(content)
        });
        
        fileCount++;
      }
    }
    
    console.log(`📁 Backed up ${fileCount} location pages across ${counties.length} counties`);
  }

  checkExistingSchema(content) {
    return content.includes('FAQSchema') || 
           content.includes('faqData') ||
           content.includes('"@type": "FAQPage"');
  }

  async backupComponents() {
    console.log('🧩 Backing up related components...');
    
    const componentsToBackup = [
      'src/components/FAQSchema.astro',
      'src/layouts/Layout.astro',
      'package.json',
      'astro.config.mjs'
    ];
    
    for (const componentPath of componentsToBackup) {
      const fullPath = path.join(process.cwd(), componentPath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const stats = fs.statSync(fullPath);
        
        // Determine backup subdirectory
        const isComponent = componentPath.includes('components/');
        const isLayout = componentPath.includes('layouts/');
        const subdir = isComponent || isLayout ? 'components' : 'configs';
        
        const backupPath = path.join(this.backupDir, subdir, path.basename(componentPath));
        fs.writeFileSync(backupPath, content);
        
        this.metadata.files.push({
          originalPath: componentPath,
          backupPath: path.relative(this.backupDir, backupPath),
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          type: isComponent ? 'component' : isLayout ? 'layout' : 'config'
        });
        
        console.log(`   ✅ Backed up: ${componentPath}`);
      } else {
        console.log(`   ⚠️  Not found: ${componentPath}`);
      }
    }
  }

  async saveMetadata() {
    // Add summary statistics
    this.metadata.summary = {
      totalFiles: this.metadata.files.length,
      locationPages: this.metadata.files.filter(f => f.originalPath.includes('locations/')).length,
      componentsAndConfigs: this.metadata.files.filter(f => 
        f.type === 'component' || f.type === 'layout' || f.type === 'config'
      ).length,
      pagesWithExistingSchema: this.metadata.files.filter(f => f.hasExistingSchema).length,
      totalSizeBytes: this.metadata.files.reduce((sum, file) => sum + file.size, 0)
    };
    
    // Calculate backup integrity hash
    this.metadata.integrityHash = this.calculateIntegrityHash();
    
    // Save metadata file
    const metadataPath = path.join(this.backupDir, 'backup-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(this.metadata, null, 2));
    
    // Create backup manifest for quick reference
    const manifest = {
      deploymentId: this.deploymentId,
      timestamp: this.metadata.timestamp,
      gitCommit: this.metadata.gitCommit,
      summary: this.metadata.summary,
      backupPath: this.backupDir
    };
    
    const manifestPath = path.join(process.cwd(), '.deployment-backups', 'backup-manifest.json');
    
    // Update or create manifest
    let manifests = [];
    if (fs.existsSync(manifestPath)) {
      try {
        manifests = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (error) {
        console.log('⚠️  Could not read existing manifest, creating new one');
      }
    }
    
    manifests.unshift(manifest); // Add to beginning
    manifests = manifests.slice(0, 20); // Keep only last 20 backups
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifests, null, 2));
    
    console.log(`📋 Backup metadata saved`);
    console.log(`📊 Summary: ${this.metadata.summary.totalFiles} files, ${this.formatBytes(this.metadata.summary.totalSizeBytes)}`);
  }

  calculateIntegrityHash() {
    // Simple hash based on file paths and sizes for integrity checking
    const hashInput = this.metadata.files
      .map(file => `${file.originalPath}:${file.size}:${file.lastModified}`)
      .sort()
      .join('|');
    
    // Simple hash function (for production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Utility functions for backup management
export class BackupUtils {
  static async listBackups() {
    const backupsDir = path.join(process.cwd(), '.deployment-backups');
    const manifestPath = path.join(backupsDir, 'backup-manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      return [];
    }
    
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error reading backup manifest:', error.message);
      return [];
    }
  }

  static async validateBackup(deploymentId) {
    const backupDir = path.join(process.cwd(), '.deployment-backups', deploymentId);
    const metadataPath = path.join(backupDir, 'backup-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Backup metadata not found: ${deploymentId}`);
    }
    
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Validate all backed up files exist
      let missingFiles = 0;
      for (const file of metadata.files) {
        const backupFilePath = path.join(backupDir, file.backupPath);
        if (!fs.existsSync(backupFilePath)) {
          console.log(`❌ Missing backup file: ${file.backupPath}`);
          missingFiles++;
        }
      }
      
      if (missingFiles > 0) {
        throw new Error(`Backup validation failed: ${missingFiles} files missing`);
      }
      
      console.log(`✅ Backup ${deploymentId} validated successfully`);
      return metadata;
      
    } catch (error) {
      throw new Error(`Backup validation failed: ${error.message}`);
    }
  }

  static async cleanupOldBackups(keepCount = 10) {
    const backups = await this.listBackups();
    const toDelete = backups.slice(keepCount);
    
    console.log(`🧹 Cleaning up ${toDelete.length} old backups (keeping ${keepCount})...`);
    
    for (const backup of toDelete) {
      try {
        const backupDir = backup.backupPath;
        if (fs.existsSync(backupDir)) {
          fs.rmSync(backupDir, { recursive: true, force: true });
          console.log(`   🗑️  Deleted: ${backup.deploymentId}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not delete ${backup.deploymentId}: ${error.message}`);
      }
    }
    
    // Update manifest
    const manifestPath = path.join(process.cwd(), '.deployment-backups', 'backup-manifest.json');
    const remainingBackups = backups.slice(0, keepCount);
    fs.writeFileSync(manifestPath, JSON.stringify(remainingBackups, null, 2));
  }
}

async function main() {
  const deploymentId = process.argv[2];
  
  if (!deploymentId) {
    console.error('❌ Usage: node create-backup.js <deployment-id>');
    process.exit(1);
  }

  try {
    const backupManager = new BackupManager(deploymentId);
    const metadata = await backupManager.createBackup();
    
    console.log(`🎉 Backup creation completed successfully!`);
    console.log(`📁 Backup location: ${metadata.backupPath || backupManager.backupDir}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Backup creation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}