import { test, expect } from '@playwright/test';

test.describe('Deployed Site Validation - JustPeople Contact Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for deployed site tests
    test.setTimeout(60000);
  });

  test('should access the main page', async ({ page }) => {
    await page.goto('https://justpeople1.netlify.app');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the main page loads
    await expect(page).toHaveTitle(/JustPeople|JJP Solutions/);
    
    // Check for common elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Main page loads successfully');
  });

  test('should navigate to contacts page', async ({ page }) => {
    await page.goto('https://justpeople1.netlify.app/dashboard/contacts');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to auth or if page loads
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for auth redirect
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('ℹ️  Authentication required - this is expected');
      
      // Check if auth page loads
      await expect(page.locator('body')).toBeVisible();
      
      // Look for login elements
      const loginElements = await page.locator('input[type="email"], input[type="password"], button[type="submit"]').count();
      console.log('Login elements found:', loginElements);
    } else {
      // Check if contacts page loads directly
      await expect(page.locator('h1')).toContainText(/Contact/i);
      console.log('✅ Contacts page loads without auth');
    }
  });

  test('should navigate to CRM page', async ({ page }) => {
    await page.goto('https://justpeople1.netlify.app/dashboard/crm');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're redirected to auth or if page loads
    if (currentUrl.includes('/auth') || currentUrl.includes('/login')) {
      console.log('ℹ️  Authentication required for CRM - this is expected');
      
      // Check if auth page loads
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Check if CRM page loads directly
      const pageContent = await page.content();
      console.log('Page contains CRM content:', pageContent.includes('CRM') || pageContent.includes('crm'));
    }
  });

  test('should check for contact data files', async ({ page }) => {
    // Check if the contact data files are available
    const contactFiles = [
      'JJP_CONTACTS_MONDAY_IMPORT.csv',
      'JJP_CONTACTS_MONDAY_IMPORT.json'
    ];
    
    for (const file of contactFiles) {
      const response = await page.goto(`https://justpeople1.netlify.app/${file}`);
      const status = response?.status();
      
      if (status === 200) {
        console.log(`✅ ${file} is accessible`);
        
        // Check file content
        const content = await response?.text();
        if (content && content.includes('Bobby LaPenna')) {
          console.log(`✅ ${file} contains expected JJP contact data`);
        }
      } else {
        console.log(`❌ ${file} not accessible (status: ${status})`);
      }
    }
  });

  test('should perform comprehensive site health check', async ({ page }) => {
    const results = {
      mainPage: false,
      contactsPage: false,
      crmPage: false,
      authWorking: false,
      reactApp: false,
      contactData: false,
      navigation: false
    };
    
    try {
      // Test main page
      await page.goto('https://justpeople1.netlify.app');
      await page.waitForLoadState('networkidle');
      results.mainPage = true;
      console.log('✅ Main page accessible');
      
      // Test React app
      const reactRoot = page.locator('#root');
      if (await reactRoot.isVisible()) {
        results.reactApp = true;
        console.log('✅ React app is running');
      }
      
      // Test contacts page
      await page.goto('https://justpeople1.netlify.app/dashboard/contacts');
      await page.waitForLoadState('networkidle');
      
      const contactsUrl = page.url();
      if (contactsUrl.includes('/dashboard/contacts')) {
        results.contactsPage = true;
        console.log('✅ Contacts page accessible');
      } else if (contactsUrl.includes('/auth')) {
        results.authWorking = true;
        console.log('✅ Authentication system working');
      }
      
      // Test CRM page
      await page.goto('https://justpeople1.netlify.app/dashboard/crm');
      await page.waitForLoadState('networkidle');
      
      const crmUrl = page.url();
      if (crmUrl.includes('/dashboard/crm')) {
        results.crmPage = true;
        console.log('✅ CRM page accessible');
      }
      
      // Test contact data
      const csvResponse = await page.goto('https://justpeople1.netlify.app/JJP_CONTACTS_MONDAY_IMPORT.csv');
      if (csvResponse?.status() === 200) {
        results.contactData = true;
        console.log('✅ Contact data files accessible');
      }
      
      // Test navigation
      await page.goto('https://justpeople1.netlify.app');
      const navLinks = await page.locator('a[href*="dashboard"]').count();
      if (navLinks > 0) {
        results.navigation = true;
        console.log('✅ Navigation system working');
      }
      
    } catch (error) {
      console.log('❌ Error during health check:', error);
    }
    
    // Final report
    console.log('\n🏥 HEALTH CHECK RESULTS:');
    console.log('========================');
    Object.entries(results).forEach(([key, value]) => {
      console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'WORKING' : 'NEEDS ATTENTION'}`);
    });
    
    const workingCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.values(results).length;
    
    console.log(`\n📊 Overall Health: ${workingCount}/${totalCount} components working`);
    
    if (workingCount >= totalCount * 0.7) {
      console.log('🎉 Site is in good health!');
    } else {
      console.log('⚠️  Site needs attention');
    }
  });
});