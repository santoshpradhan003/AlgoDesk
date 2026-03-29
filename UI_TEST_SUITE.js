/**
 * ALGODESK v4 - COMPREHENSIVE UI TEST SUITE
 * Run from browser console: (copy entire script and paste in F12 DevTools Console)
 * Tests all navigation, features, and error recovery
 */

const UITest = {
  results: [],
  passCount: 0,
  failCount: 0,
  
  // Test logging
  log(test, pass, message) {
    const status = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${test} - ${message}`);
    this.results.push({ test, pass, message, time: new Date().toISOString() });
    if (pass) this.passCount++; else this.failCount++;
  },
  
  // TEST 1: Navigation System
  testNavigation() {
    console.log('\n=== TEST 1: NAVIGATION SYSTEM ===');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    this.log('Nav Buttons Exist', navButtons.length > 0, `Found ${navButtons.length} nav buttons`);
    this.log('Nav Buttons Have onclick', 
      Array.from(navButtons).every(b => b.getAttribute('onclick')), 
      `All buttons have onclick handlers`);
    
    // Test clicking each button
    const pages = ['dashboard', 'strategies', 'marketdata', 'signals', 'screener', 
                   'watchlist', 'backtest', 'analytics', 'journal', 'execution',
                   'portfolio', 'rebalance', 'history', 'risk', 'alerts', 'health',
                   'connect', 'settings', 'logs'];
    
    pages.forEach(page => {
      const btn = document.querySelector(`[onclick*="'${page}'"]`);
      const pageEl = document.getElementById(`page-${page}`);
      const btnExists = btn !== null;
      const pageExists = pageEl !== null;
      this.log(`Nav: ${page}`, btnExists && pageExists, 
        `Button: ${btnExists ? '✓' : '✗'}, Page: ${pageExists ? '✓' : '✗'}`);
    });
  },
  
  // TEST 2: DOM Structure
  testDOMStructure() {
    console.log('\n=== TEST 2: DOM STRUCTURE ===');
    
    this.log('Nav Sidebar', document.querySelector('.nav-sidebar') !== null, 'Sidebar exists');
    this.log('Main Content', document.querySelector('.main-content') !== null, 'Main content exists');
    this.log('Pages Container', document.querySelector('.pages') !== null, 'Pages container exists');
    this.log('Header', document.querySelector('header') !== null, 'Header exists');
    
    const pages = document.querySelectorAll('.page');
    this.log('Page Elements', pages.length >= 18, `Found ${pages.length} page elements (expecting ≥18)`);
  },
  
  // TEST 3: Data Persistence
  testDataPersistence() {
    console.log('\n=== TEST 3: DATA PERSISTENCE ===');
    
    // Check IndexedDB
    const idbExists = window.indexedDB !== undefined;
    this.log('IndexedDB Available', idbExists, 'Browser supports IndexedDB');
    
    // Check localStorage
    const lsAvailable = (() => {
      try { localStorage.setItem('test_x', '1'); localStorage.removeItem('test_x'); return true; }
      catch(e) { return false; }
    })();
    this.log('localStorage Available', lsAvailable, 'Browser supports localStorage');
    
    // Check if data exists
    const savedData = localStorage.getItem('A');
    this.log('Saved State Data', savedData !== null, `State data ${savedData ? 'loaded' : 'not found'}`);
  },
  
  // TEST 4: Global State
  testGlobalState() {
    console.log('\n=== TEST 4: GLOBAL STATE (Object A) ===');
    
    this.log('Global State', typeof A === 'object', 'Object A is defined');
    
    if (typeof A === 'object') {
      const keys = ['botActive', 'paperMode', 'broker', 'connected', 'watchlist', 
                    'portfolio', 'trades', 'orders', 'alerts'];
      keys.forEach(key => {
        this.log(`State.${key}`, A.hasOwnProperty(key), `Property exists`);
      });
    }
  },
  
  // TEST 5: Core Functions
  testCoreFunctions() {
    console.log('\n=== TEST 5: CORE FUNCTIONS ===');
    
    const functions = ['navigate', 'placeOrder', 'addPosition', 'logTrade', 
                       'addToWL', 'addAlert', 'saveData', 'backupData',
                       'renderConnectPage', 'genAnalytics', 'renderMarketMovers',
                       'runMLSignals', 'refreshHealth', 'boot', 'initIndexedDB'];
    
    functions.forEach(fn => {
      const exists = typeof window[fn] === 'function';
      this.log(`Function: ${fn}`, exists, exists ? 'Defined' : 'Missing');
    });
  },
  
  // TEST 6: Resilience Features
  testResilience() {
    console.log('\n=== TEST 6: RESILIENCE FEATURES ===');
    
    this.log('CircuitBreaker Class', typeof CircuitBreaker === 'function', 'Class defined');
    this.log('Transaction Class', typeof Transaction === 'function', 'Class defined');
    
    const breaker = typeof apiBreaker !== 'undefined' ? apiBreaker : null;
    const dhanBreaker = typeof window.dhanBreaker !== 'undefined' ? window.dhanBreaker : null;
    
    this.log('API Breaker Instance', breaker !== null, 'Circuit breaker for API calls');
    this.log('DHAN Breaker Instance', dhanBreaker !== null, 'Circuit breaker for DHAN API');
  },
  
  // TEST 7: DHAN API Integration
  testDHANAPI() {
    console.log('\n=== TEST 7: DHAN API INTEGRATION ===');
    
    const dhanConfig = typeof window.dhanConfig !== 'undefined' ? window.dhanConfig : null;
    this.log('DHAN Config', dhanConfig !== null, 'Configuration defined');
    
    if (dhanConfig) {
      this.log('DHAN Base URL', dhanConfig.baseURL === 'https://api.dhan.co/v2', 'Correct API endpoint');
      this.log('DHAN Client ID', dhanConfig.clientID !== '', 'Client ID configured');
    }
    
    const dhanFunctions = ['dhanAuth', 'dhanPlaceOrder', 'dhanModifyOrder', 
                           'dhanCancelOrder', 'dhanGetHoldings', 'dhanGetPositions',
                           'dhanGetOrders', 'dhanGetAccount', 'syncDhanPortfolio'];
    
    dhanFunctions.forEach(fn => {
      const exists = typeof window[fn] === 'function';
      this.log(`DHAN Function: ${fn}`, exists, exists ? 'Defined' : 'Missing');
    });
  },
  
  // TEST 8: CSS & Styling
  testStyling() {
    console.log('\n=== TEST 8: CSS & STYLING ===');
    
    const stylesheet = document.querySelector('style');
    this.log('Inline Stylesheet', stylesheet !== null, 'Styles defined');
    
    // Check for critical CSS classes
    const navBtn = document.querySelector('.nav-btn');
    if (navBtn) {
      const computed = window.getComputedStyle(navBtn);
      this.log('Nav Button Cursor', computed.cursor !== 'not-allowed', 'Buttons are interactive');
      this.log('Nav Button Pointer Events', computed.pointerEvents !== 'none', 'Buttons accept clicks');
    }
  },
  
  // TEST 9: Error Handling
  testErrorHandling() {
    console.log('\n=== TEST 9: ERROR HANDLING ===');
    
    // Test input validation
    const validSymbol = (() => {
      try { return validateSymbol('RELIANCE') === true; }
      catch(e) { return false; }
    })();
    this.log('Input Validation: Symbol', validSymbol, 'Valid symbol accepted');
    
    const invalidQuantity = (() => {
      try { return validateQuantity(-1) === false; }
      catch(e) { return false; }
    })();
    this.log('Input Validation: Quantity', invalidQuantity, 'Invalid quantity rejected');
  },
  
  // TEST 10: Browser Console
  testConsoleErrors() {
    console.log('\n=== TEST 10: CONSOLE ERRORS ===');
    
    // Check if errors exist in console (this is a suggestion to user)
    console.warn('⚠ Check browser console (F12 → Console tab) for:');
    console.warn('  - Red error messages (unexpected)');
    console.warn('  - Warning messages (tolerable)');
    console.warn('  - Navigation logs (green checkmarks expected)');
  },
  
  // Navigate to each page and verify display
  async testNavALL() {
    console.log('\n=== BONUS: NAVIGATE TO ALL PAGES ===');
    
    const pages = ['dashboard', 'strategies', 'marketdata', 'signals', 'screener',
                   'watchlist', 'backtest', 'analytics', 'journal', 'execution',
                   'portfolio', 'rebalance', 'history', 'risk', 'alerts', 'health',
                   'connect', 'settings', 'logs'];
    
    for (const page of pages) {
      try {
        navigate(page);
        await new Promise(r => setTimeout(r, 100));
        const pageEl = document.getElementById(`page-${page}`);
        const isVisible = pageEl && pageEl.style.display !== 'none' && pageEl.classList.contains('active');
        console.log(`✓ ${page}: ${isVisible ? 'VISIBLE' : 'NOT VISIBLE'}`);
      } catch(e) {
        console.error(`✗ ${page}: ERROR -`, e.message);
      }
    }
  },
  
  // Generate report
  report() {
    console.log('\n========================================');
    console.log('   ALGODESK v4 TEST REPORT');
    console.log('========================================');
    console.log(`✓ PASSED: ${this.passCount}`);
    console.log(`✗ FAILED: ${this.failCount}`);
    console.log(`TOTAL: ${this.passCount + this.failCount}`);
    console.log(`SUCCESS RATE: ${((this.passCount / (this.passCount + this.failCount)) * 100).toFixed(1)}%`);
    console.log('========================================\n');
    
    if (this.failCount > 0) {
      console.log('FAILED TESTS:');
      this.results.filter(r => !r.pass).forEach(r => {
        console.log(`  • ${r.test}: ${r.message}`);
      });
    } else {
      console.log('✓ ALL TESTS PASSED! Application is functional.');
    }
    
    console.log('\nNEXT STEPS:');
    console.log('  1. Navigate through all tabs manually to verify');
    console.log('  2. Test paper order placement');
    console.log('  3. Test DHAN API if credentials available');
    console.log('  4. Check browser console for errors (F12 → Console)');
  },
  
  // Run all tests
  runAll() {
    console.clear();
    console.log('🚀 STARTING COMPREHENSIVE UI TEST SUITE...\n');
    
    this.testNavigation();
    this.testDOMStructure();
    this.testDataPersistence();
    this.testGlobalState();
    this.testCoreFunctions();
    this.testResilience();
    this.testDHANAPI();
    this.testStyling();
    this.testErrorHandling();
    this.testConsoleErrors();
    
    setTimeout(() => {
      this.testNavALL().then(() => this.report());
    }, 500);
  }
};

// START TEST SUITE
UITest.runAll();

// Make available for manual testing
console.log('\nℹ For debugging, use:');
console.log('  - navigate("page") to jump to any page');
console.log('  - console.log(A) to view global state');
console.log('  - UITest.results to see all test results');
