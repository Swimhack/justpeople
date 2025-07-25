import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Complete Contact Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the contacts page
    await page.goto('http://localhost:5173/contacts');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display contacts page with import functionality', async ({ page }) => {
    // Check if the contacts page is loaded
    await expect(page.locator('h1', { hasText: 'Contact Management' })).toBeVisible();
    
    // Check if Import Contacts button is visible
    await expect(page.locator('button', { hasText: 'Import Contacts' })).toBeVisible();
    
    // Check if Send Email button is visible
    await expect(page.locator('button', { hasText: 'Send Email' })).toBeVisible();
    
    // Check if search functionality is available
    await expect(page.locator('input[placeholder="Search contacts..."]')).toBeVisible();
    
    // Check if status filter is available
    await expect(page.locator('text=Filter by status')).toBeVisible();
  });

  test('should open import dialog with ContactImporter component', async ({ page }) => {
    // Click on Import Contacts button
    await page.click('button:has-text("Import Contacts")');
    
    // Check if import dialog is opened
    await expect(page.locator('text=Import Contacts')).toBeVisible();
    await expect(page.locator('text=Import contacts from CSV or JSON files')).toBeVisible();
    
    // Check if ContactImporter component is loaded
    await expect(page.locator('text=Contact Importer')).toBeVisible();
    await expect(page.locator('text=Import contacts from Monday.com CSV or JSON files')).toBeVisible();
    
    // Check if file upload options are available
    await expect(page.locator('input[type="file"][accept=".csv"]')).toBeVisible();
    await expect(page.locator('input[type="file"][accept=".json"]')).toBeVisible();
  });

  test('should handle CSV file upload and import process', async ({ page }) => {
    // Create test CSV data
    const testCsvData = `name,email,phone,company,title,location,notes,tags,status
"Test Contact 1","test1@example.com","1234567890","Test Company","Manager","Test City","Test notes","JJP,Test","Lead"
"Test Contact 2","test2@example.com","0987654321","Another Corp","Developer","Another City","More notes","JJP,Dev","Lead"`;

    // Create temporary CSV file
    const tempCsvPath = path.join(__dirname, '../temp-integration-test.csv');
    require('fs').writeFileSync(tempCsvPath, testCsvData);

    // Open import dialog
    await page.click('button:has-text("Import Contacts")');
    
    // Upload CSV file
    const csvInput = page.locator('input[type="file"][accept=".csv"]');
    await csvInput.setInputFiles(tempCsvPath);
    
    // Verify file is selected
    await expect(page.locator('text=temp-integration-test.csv')).toBeVisible();
    
    // Click import button
    const importButton = page.locator('button:has-text("Import Contacts")');
    await expect(importButton).toBeEnabled();
    await importButton.click();
    
    // Check for progress indication
    await expect(page.locator('text=Importing contacts...')).toBeVisible({ timeout: 5000 });
    
    // Wait for import completion
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
    
    // Check import statistics
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Imported')).toBeVisible();
    
    // Clean up
    require('fs').unlinkSync(tempCsvPath);
  });

  test('should display imported contacts in contacts list', async ({ page }) => {
    // First, import some test data
    const testJsonData = JSON.stringify([
      {
        name: "Integration Test Contact",
        email: "integration@test.com",
        phone: "5555555555",
        company: "Test Integration Corp",
        title: "Test Manager",
        location: "Test Location",
        notes: "Integration test contact",
        tags: ["Integration", "Test"],
        status: "Lead"
      }
    ]);

    const tempJsonPath = path.join(__dirname, '../temp-integration-contact.json');
    require('fs').writeFileSync(tempJsonPath, testJsonData);

    // Open import dialog and import
    await page.click('button:has-text("Import Contacts")');
    const jsonInput = page.locator('input[type="file"][accept=".json"]');
    await jsonInput.setInputFiles(tempJsonPath);
    await page.click('button:has-text("Import Contacts")');
    
    // Wait for import completion
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
    
    // Close the import dialog
    await page.keyboard.press('Escape');
    
    // Check if the imported contact appears in the contacts list
    await expect(page.locator('text=Integration Test Contact')).toBeVisible();
    await expect(page.locator('text=integration@test.com')).toBeVisible();
    await expect(page.locator('text=Test Integration Corp')).toBeVisible();
    
    // Check if phone number is displayed
    await expect(page.locator('text=5555555555')).toBeVisible();
    
    // Check if title is displayed
    await expect(page.locator('text=Test Manager')).toBeVisible();
    
    // Check if location is displayed
    await expect(page.locator('text=Test Location')).toBeVisible();
    
    // Check if tags are displayed
    await expect(page.locator('text=Integration')).toBeVisible();
    await expect(page.locator('text=Test')).toBeVisible();
    
    // Clean up
    require('fs').unlinkSync(tempJsonPath);
  });

  test('should handle search functionality with imported contact data', async ({ page }) => {
    // Test search by name
    await page.fill('input[placeholder="Search contacts..."]', 'Integration Test Contact');
    await page.waitForTimeout(500);
    
    // Check if search results are filtered
    const contactCards = page.locator('.shadow-soft');
    await expect(contactCards).toHaveCount(1);
    
    // Clear search and test phone search
    await page.fill('input[placeholder="Search contacts..."]', '');
    await page.fill('input[placeholder="Search contacts..."]', '5555555555');
    await page.waitForTimeout(500);
    
    // Check if phone search works
    await expect(page.locator('text=Integration Test Contact')).toBeVisible();
    
    // Test company search
    await page.fill('input[placeholder="Search contacts..."]', 'Test Integration Corp');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Integration Test Contact')).toBeVisible();
    
    // Test tag search
    await page.fill('input[placeholder="Search contacts..."]', 'Integration');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Integration Test Contact')).toBeVisible();
  });

  test('should handle contact status updates', async ({ page }) => {
    // Find the contact and update its status
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('in_progress');
    
    // Check if status update was successful
    await expect(page.locator('text=Status updated')).toBeVisible();
    
    // Verify the status badge is updated
    await expect(page.locator('text=in progress')).toBeVisible();
  });

  test('should handle email functionality for imported contacts', async ({ page }) => {
    // Find a contact and click reply
    const replyButton = page.locator('button:has-text("Reply")').first();
    await replyButton.click();
    
    // Check if email dialog opens
    await expect(page.locator('text=Send Email')).toBeVisible();
    
    // Check if email is pre-populated
    await expect(page.locator('input[placeholder="recipient@example.com"]')).toHaveValue('integration@test.com');
    
    // Check if subject is pre-populated
    const subjectInput = page.locator('input[placeholder="Email subject"]');
    await expect(subjectInput).toHaveValue(/^Re:/);
    
    // Check if message template is pre-populated
    const messageTextarea = page.locator('textarea[placeholder="Email message..."]');
    await expect(messageTextarea).toHaveValue(/Dear Integration Test Contact/);
  });

  test('should navigate to CRM dashboard and verify integration', async ({ page }) => {
    // Navigate to CRM dashboard
    await page.goto('http://localhost:5173/admin/crm');
    await page.waitForLoadState('networkidle');
    
    // Check if CRM dashboard is loaded
    await expect(page.locator('h1', { hasText: 'CRM Dashboard' })).toBeVisible();
    
    // Check if Import Contacts tab is available
    await expect(page.locator('button[data-value="import"]')).toBeVisible();
    
    // Click on Import Contacts tab
    await page.click('button[data-value="import"]');
    
    // Check if ContactImporter is loaded in CRM
    await expect(page.locator('text=Contact Importer')).toBeVisible();
    
    // Check if leads tab shows imported data
    await page.click('button[data-value="leads"]');
    await expect(page.locator('text=Recent Leads')).toBeVisible();
    
    // Check if search functionality works in CRM
    await expect(page.locator('input[placeholder="Search leads..."]')).toBeVisible();
  });

  test('should validate end-to-end contact lifecycle', async ({ page }) => {
    // Start at contacts page
    await page.goto('http://localhost:5173/contacts');
    
    // Import a contact
    await page.click('button:has-text("Import Contacts")');
    
    const lifecycleContactData = JSON.stringify([{
      name: "Lifecycle Test Contact",
      email: "lifecycle@test.com",
      phone: "7777777777",
      company: "Lifecycle Corp",
      title: "Lifecycle Manager",
      location: "Lifecycle City",
      notes: "End-to-end test contact",
      tags: ["Lifecycle", "E2E"],
      status: "Lead"
    }]);
    
    const tempPath = path.join(__dirname, '../temp-lifecycle-test.json');
    require('fs').writeFileSync(tempPath, lifecycleContactData);
    
    const jsonInput = page.locator('input[type="file"][accept=".json"]');
    await jsonInput.setInputFiles(tempPath);
    await page.click('button:has-text("Import Contacts")');
    
    // Wait for import and close dialog
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
    await page.keyboard.press('Escape');
    
    // Verify contact appears in contacts list
    await expect(page.locator('text=Lifecycle Test Contact')).toBeVisible();
    
    // Update contact status
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('in_progress');
    await expect(page.locator('text=Status updated')).toBeVisible();
    
    // Send email to contact
    await page.click('button:has-text("Reply")');
    await expect(page.locator('input[placeholder="recipient@example.com"]')).toHaveValue('lifecycle@test.com');
    
    // Navigate to CRM to verify lead integration
    await page.goto('http://localhost:5173/admin/crm');
    await page.waitForLoadState('networkidle');
    
    // Check leads tab
    await page.click('button[data-value="leads"]');
    
    // Verify lead appears in CRM
    await expect(page.locator('text=Lifecycle Test Contact')).toBeVisible();
    
    // Clean up
    require('fs').unlinkSync(tempPath);
  });

  test('should handle real JJP contact data import', async ({ page }) => {
    // This test uses the actual JJP contact files
    const csvPath = '/mnt/c/Users/james/Desktop/RANDOM/AI/JJP/justpeople/public/JJP_CONTACTS_MONDAY_IMPORT.csv';
    const jsonPath = '/mnt/c/Users/james/Desktop/RANDOM/AI/JJP/justpeople/public/JJP_CONTACTS_MONDAY_IMPORT.json';
    
    const fs = require('fs');
    
    // Test CSV import if file exists
    if (fs.existsSync(csvPath)) {
      await page.click('button:has-text("Import Contacts")');
      
      const csvInput = page.locator('input[type="file"][accept=".csv"]');
      await csvInput.setInputFiles(csvPath);
      
      await expect(page.locator('text=JJP_CONTACTS_MONDAY_IMPORT.csv')).toBeVisible();
      
      await page.click('button:has-text("Import Contacts")');
      
      // Wait for import completion
      await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 60000 });
      
      // Close dialog
      await page.keyboard.press('Escape');
      
      // Verify some JJP contacts are imported
      await expect(page.locator('text=Bobby LaPenna')).toBeVisible();
      await expect(page.locator('text=Bedford TX Government')).toBeVisible();
      await expect(page.locator('text=Deputy Chief of Police')).toBeVisible();
      
      // Test search with JJP data
      await page.fill('input[placeholder="Search contacts..."]', 'JJP');
      await page.waitForTimeout(500);
      
      // Should find multiple JJP contacts
      const jjpContacts = page.locator('text=JJP');
      await expect(jjpContacts).toHaveCount(27, { timeout: 10000 });
    }
  });
});

test.describe('Contact Management Advanced Features', () => {
  test('should handle email validation and phone-only contacts', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');
    
    // Test importing contact with no email (phone only)
    const phoneOnlyContact = JSON.stringify([{
      name: "Phone Only Contact",
      email: "", // Empty email
      phone: "9999999999",
      company: "Phone Only Corp",
      title: "Phone Contact",
      location: "Phone City",
      notes: "Contact with phone only",
      tags: ["PhoneOnly"],
      status: "Lead"
    }]);
    
    const tempPath = path.join(__dirname, '../temp-phone-only.json');
    require('fs').writeFileSync(tempPath, phoneOnlyContact);
    
    await page.click('button:has-text("Import Contacts")');
    const jsonInput = page.locator('input[type="file"][accept=".json"]');
    await jsonInput.setInputFiles(tempPath);
    await page.click('button:has-text("Import Contacts")');
    
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
    await page.keyboard.press('Escape');
    
    // Verify contact with generated email appears
    await expect(page.locator('text=Phone Only Contact')).toBeVisible();
    await expect(page.locator('text=noemail+9999999999@jjpsolutions.com')).toBeVisible();
    
    require('fs').unlinkSync(tempPath);
  });

  test('should handle duplicate detection correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/contacts');
    
    // Import same contact twice
    const duplicateContact = JSON.stringify([{
      name: "Duplicate Test Contact",
      email: "duplicate@test.com",
      phone: "1111111111",
      company: "Duplicate Corp",
      title: "Duplicate Manager",
      location: "Duplicate City",
      notes: "First import",
      tags: ["Duplicate"],
      status: "Lead"
    }]);
    
    const tempPath = path.join(__dirname, '../temp-duplicate.json');
    require('fs').writeFileSync(tempPath, duplicateContact);
    
    // First import
    await page.click('button:has-text("Import Contacts")');
    let jsonInput = page.locator('input[type="file"][accept=".json"]');
    await jsonInput.setInputFiles(tempPath);
    await page.click('button:has-text("Import Contacts")');
    
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
    await page.keyboard.press('Escape');
    
    // Second import (should detect duplicate)
    await page.click('button:has-text("Import Contacts")');
    jsonInput = page.locator('input[type="file"][accept=".json"]');
    await jsonInput.setInputFiles(tempPath);
    await page.click('button:has-text("Import Contacts")');
    
    await expect(page.locator('text=Import completed')).toBeVisible({ timeout: 30000 });
    
    // Check duplicate statistics
    await expect(page.locator('text=1').first()).toBeVisible(); // 1 duplicate
    
    require('fs').unlinkSync(tempPath);
  });
});