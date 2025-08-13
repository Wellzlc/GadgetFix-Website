import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Bundle Size Test Suite
test('JavaScript Bundle Size', () => {
  const distPath = path.resolve(__dirname, '../../dist');
  const jsFiles = fs.readdirSync(distPath)
    .filter(file => file.endsWith('.js'));

  // Max total bundle size: 500 KB
  const MAX_TOTAL_BUNDLE_SIZE = 500 * 1024; 

  // Max individual file size: 150 KB
  const MAX_INDIVIDUAL_FILE_SIZE = 150 * 1024;

  let totalBundleSize = 0;

  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Individual file size check
    expect(fileSize).toBeLessThan(MAX_INDIVIDUAL_FILE_SIZE);
    
    totalBundleSize += fileSize;
  });

  // Total bundle size check
  expect(totalBundleSize).toBeLessThan(MAX_TOTAL_BUNDLE_SIZE);
});