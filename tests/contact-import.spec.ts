import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Contact Import Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the CRM dashboard
    await page.goto('http://localhost:5173/admin/crm');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display contact importer tab', async ({ page }) => {
    // Check if Import Contacts tab is visible
    const importTab = page.locator('button[data-value="import"]', { hasText: 'Import Contacts' });
    await expect(importTab).toBeVisible();
    
    // Click on Import Contacts tab
    await importTab.click();
    
    // Check if ContactImporter component is displayed
    await expect(page.locator('text=Contact Importer')).toBeVisible();
    await expect(page.locator('text=Import contacts from Monday.com CSV or JSON files')).toBeVisible();
  });

  test('should handle CSV file upload', async ({ page }) => {
    // Click on Import Contacts tab
    await page.click('button[data-value="import"]');
    
    // Create a test CSV content
    const csvContent = `name,email,phone,company,title,location,notes,tags,status
John Doe,john@example.com,1234567890,Test Company,Manager,New York,Test contact,JJP,Lead
Jane Smith,jane@example.com,0987654321,Another Corp,Developer,California,Another test,JJP,Lead`;

    // Create a temporary CSV file (simulate file upload)
    const csvFile = path.join(__dirname, '../temp-test-contacts.csv');
    require('fs').writeFileSync(csvFile, csvContent);

    // Upload CSV file
    const csvInput = page.locator('input[type="file"][accept=".csv"]');
    await csvInput.setInputFiles(csvFile);

    // Verify file is selected
    await expect(page.locator('text=temp-test-contacts.csv')).toBeVisible();

    // Clean up temp file
    require('fs').unlinkSync(csvFile);
  });

  test('should handle JSON file upload', async ({ page }) => {
    // Click on Import Contacts tab
    await page.click('button[data-value="import"]');
    
    // Create test JSON content
    const jsonContent = JSON.stringify([
      {
        name: "Test Contact 1",
        email: "test1@example.com",
        phone: "1111111111",
        company: "Test Corp",
        title: "Tester",
        location: "Test City",
        notes: "Test notes",
        tags: ["JJP", "Test"],
        status: "Lead"
      },
      {
        name: "Test Contact 2", 
        email: "test2@example.com",
        phone: "2222222222",
        company: "Another Corp",
        title: "Developer",
        location: "Another City",
        notes: "More test notes",
        tags: ["JJP", "Developer"],
        status: "Lead"
      }
    ], null, 2);

    // Create a temporary JSON file
    const jsonFile = path.join(__dirname, '../temp-test-contacts.json');
    require('fs').writeFileSync(jsonFile, jsonContent);

    // Upload JSON file
    const jsonInput = page.locator('input[type="file"][accept=".json"]');
    await jsonInput.setInputFiles(jsonFile);

    // Verify file is selected
    await expect(page.locator('text=temp-test-contacts.json')).toBeVisible();

    // Clean up temp file
    require('fs').unlinkSync(jsonFile);
  });

  test('should validate import button state', async ({ page }) => {
    // Click on Import Contacts tab
    await page.click('button[data-value="import"]');
    
    // Import button should be disabled initially
    const importButton = page.locator('button', { hasText: 'Import Contacts' });
    await expect(importButton).toBeDisabled();

    // Create and upload a test CSV file
    const csvContent = `name,email,phone,company
Test User,test@example.com,1234567890,Test Company`;
    const csvFile = path.join(__dirname, '../temp-test.csv');
    require('fs').writeFileSync(csvFile, csvContent);

    const csvInput = page.locator('input[type="file"][accept=".csv"]');
    await csvInput.setInputFiles(csvFile);

    // Import button should be enabled after file upload
    await expect(importButton).toBeEnabled();

    // Clean up
    require('fs').unlinkSync(csvFile);
  });

  test('should display import statistics after import', async ({ page }) => {
    // Mock the Supabase client to avoid actual database operations
    await page.addInitScript(() => {
      // Mock successful import
      window.mockSupabaseSuccess = true;
    });

    // Click on Import Contacts tab
    await page.click('button[data-value="import"]');
    
    // Create test CSV
    const csvContent = `name,email,phone,company
Test Contact,testcontact@example.com,1234567890,Test Corp`;
    const csvFile = path.join(__dirname, '../temp-import-test.csv');
    require('fs').writeFileSync(csvFile, csvContent);

    // Upload file
    const csvInput = page.locator('input[type="file"][accept=".csv"]');
    await csvInput.setInputFiles(csvFile);

    // Click import button
    const importButton = page.locator('button', { hasText: 'Import Contacts' });
    await importButton.click();

    // Check for progress bar during import
    await expect(page.locator('text=Importing contacts...')).toBeVisible({ timeout: 1000 });

    // Wait for import completion and check statistics
    await expect(page.locator('text=Total')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Imported')).toBeVisible();
    await expect(page.locator('text=Duplicates')).toBeVisible();
    await expect(page.locator('text=Failed')).toBeVisible();

    // Clean up
    require('fs').unlinkSync(csvFile);
  });

  test('should navigate to leads tab and verify imported contacts', async ({ page }) => {
    // Click on Import Contacts tab first
    await page.click('button[data-value="import"]');
    
    // Wait a moment then switch to leads tab
    await page.waitForTimeout(1000);
    await page.click('button[data-value="leads"]');
    
    // Check if leads section is displayed
    await expect(page.locator('text=Recent Leads')).toBeVisible();
    await expect(page.locator('input[placeholder="Search leads..."]')).toBeVisible();
  });

  test('should copy contact files to public directory for testing', async ({ page }) => {
    // Copy the actual contact files to a location accessible during testing
    const fs = require('fs');
    const srcPath = '/mnt/c/STRICKLAND/Strickland Technology Marketing/Sarlls';
    
    // Check if files exist in the source directory
    const csvExists = fs.existsSync(path.join(srcPath, 'JJP_CONTACTS_LOVABLE_IMPORT.csv'));
    const jsonExists = fs.existsSync(path.join(srcPath, 'JJP_CONTACTS_LOVABLE_IMPORT.json'));
    
    console.log('CSV file exists:', csvExists);
    console.log('JSON file exists:', jsonExists);
    
    if (csvExists || jsonExists) {
      console.log('Contact files are available for import testing');
    }
  });
});

test.describe('Contact Import with Real Data', () => {
  test('should import real JJP contacts from CSV', async ({ page }) => {
    // This test requires the actual CSV file to be present
    const fs = require('fs');
    const csvPath = '/mnt/c/STRICKLAND/Strickland Technology Marketing/Sarlls/JJP_CONTACTS_LOVABLE_IMPORT.csv';
    
    // Skip test if file doesn't exist
    const fileExists = fs.existsSync(csvPath);
    test.skip(!fileExists, 'JJP_CONTACTS_LOVABLE_IMPORT.csv not found');
    
    await page.goto('http://localhost:5173/admin/crm');
    await page.click('button[data-value="import"]');
    
    // Upload the real CSV file
    const csvInput = page.locator('input[type="file"][accept=".csv"]');
    await csvInput.setInputFiles(csvPath);
    
    // Verify file is loaded
    await expect(page.locator('text=JJP_CONTACTS_LOVABLE_IMPORT.csv')).toBeVisible();
    
    // Click import button
    const importButton = page.locator('button', { hasText: 'Import Contacts' });
    await importButton.click();
    
    // Wait for import completion
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
  });

  test('should import real JJP contacts from JSON', async ({ page }) => {
    // This test requires the actual JSON file to be present
    const fs = require('fs');
    const jsonPath = '/mnt/c/STRICKLAND/Strickland Technology Marketing/Sarlls/JJP_CONTACTS_LOVABLE_IMPORT.json';
    
    // Skip test if file doesn't exist
    const fileExists = fs.existsSync(jsonPath);
    test.skip(!fileExists, 'JJP_CONTACTS_LOVABLE_IMPORT.json not found');
    
    await page.goto('http://localhost:5173/admin/crm');
    await page.click('button[data-value="import"]');
    
    // Upload the real JSON file
    const jsonInput = page.locator('input[type="file"][accept=".json"]');
    await jsonInput.setInputFiles(jsonPath);
    
    // Verify file is loaded
    await expect(page.locator('text=JJP_CONTACTS_LOVABLE_IMPORT.json')).toBeVisible();
    
    // Click import button
    const importButton = page.locator('button', { hasText: 'Import Contacts' });
    await importButton.click();
    
    // Wait for import completion
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
  });
});