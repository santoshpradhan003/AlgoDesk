# AlgoDESK v4 - Verification Checklist

## 🎯 Post-Implementation Testing Guide

This checklist ensures all recent fixes and implementations are working correctly.

---

## Phase 8A - Navigation Fix Verification

**Status**: ✅ CRITICAL FIX APPLIED (Commit bf71911)

### Test All 19 Navigation Tabs

```
Core Tabs:
☐ Dashboard tab loads (blue icon, right side shows live stats)
☐ Portfolio tab loads (holdings + positions visible)
☐ Execution tab loads (order form appears)
☐ Analysis tab loads (strategy grid visible)
☐ Risk Manager tab loads (risk widgets visible)

Analysis Tabs:
☐ Strategies loads (strategy cards visible)
☐ Backtest loads (backtest interface visible)
☐ Technical tab loads (indicators list visible)
☐ Screener loads (screener grid visible)
☐ Analytics loads (charts visible)
☐ Trade Journal loads (trade entries visible)

Risk Tabs:
☐ Capital Limits loads (allocation bars visible)
☐ Position Limits loads (limits grid visible)
☐ Daily Limits loads (daily loss display)
☐ Sector Exposure loads (sector breakdown visible)
☐ Monitoring loads (P&L monitor visible)

System Tabs:
☐ System Health loads (health metrics visible)
☐ Key Shortcuts loads (shortcuts list visible)
☐ Settings loads (theme options visible)
☐ Activity Log loads (log entries visible)

Expected Behavior:
✓ Clicking any tab loads instantly (< 100ms)
✓ No console errors (open F12 → Console)
✓ Previous content disappears, new content appears
✓ Active tab shows blue highlight
```

### Manual Test Steps

1. **Hard Refresh**
   ```
   Press: Ctrl+Shift+R (to clear cache)
   Open: file:///C:/Users/santo/OneDrive/Desktop/AlgoDesk/algodesk-v4.html
   ```

2. **Check Browser Console** (F12 → Console)
   ```
   Expected: No red error messages
   If errors appear, take screenshot and report
   ```

3. **Click Each Tab Sequentially**
   ```
   Click → Wait for content → Verify loaded → Click next
   Repeat for all 19 tabs
   Record any that don't load
   ```

4. **Rapid Click Test**
   ```
   Click 5 different tabs very quickly
   Verify no crashes or hung states
   All tabs should respond
   ```

---

## Phase 8B - Backend Server Setup

**Status**: ✅ IMPLEMENTATION COMPLETE (Commit 420216b)

### Prerequisites Check

```
☐ Python 3.9+ installed
   > python --version
   Expected: Python 3.9.x or higher

☐ Port 5000 available
   > netstat -ano | findstr :5000
   Expected: No output (port free)
   If in use: taskkill /PID <PID> /F

☐ Virtual environment created
   > python -m venv venv
   Expected: venv/ folder created
```

### Installation Steps

```bash
# 1. Navigate to project
cd "c:\Users\santo\OneDrive\Desktop\AlgoDesk"

# 2. Activate virtual environment
venv\Scripts\activate
Expected: (venv) appears in terminal

# 3. Install dependencies
pip install -r requirements.txt
Expected: All 9 packages install (Flask, SocketIO, etc.)

# 4. Verify installation
python -c "import flask; import socketio; print('OK')"
Expected: OK printed with no errors
```

### Backend Startup

```bash
# 1. Start server
python dhan_server.py

# Expected output:
#  * Serving Flask app 'dhan_server'
#  * WARNING: This is a development server...
#  * Running on http://127.0.0.1:5000 
#  * WebSocket server initialized
#  * Ready to accept connections
#
# ⚠️ Server must be RUNNING for tests below
```

### Backend Health Check

**Test 1: Health Endpoint**
```
Open browser: http://127.0.0.1:5000/api/health

Expected response:
{
  "status": "healthy",
  "backend": "Flask server running",
  "websocket": "SocketIO connected",
  "python_version": "3.x.x",
  "features": {
    "dhan_api_proxy": true,
    "websocket_streaming": true,
    "oauth2_authentication": true
  }
}
```

**Test 2: Status Endpoint**
```bash
curl http://127.0.0.1:5000/api/status

Expected: {"status":"ok","connected_clients":0,...}
```

**Test 3: Load Application via Backend**
```
Open: http://127.0.0.1:5000

Expected:
✓ Application loads
✓ Browser console shows: "WebSocket connected to Flask backend"
✓ Status badge appears in Settings → System Health
✓ No connection errors
```

**Test 4: WebSocket Connection**
```javascript
// Console (F12 → Console)
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);

Expected:
Socket connected: true
Socket ID: /socket.io/?EIO=4&transport=websocket&sid=xxxxx
```

---

## Phase 8C - DHAN OAuth2 Integration

**Status**: ✅ IMPLEMENTATION COMPLETE (Commit 420216b)

### Prerequisites

```
☐ DHAN account created (https://www.dhan.co/)
☐ API credentials obtained
   Location: Dashboard → Settings → API & Integration
   Have: Client ID and Client Secret
☐ Callback URL configured
   Set in DHAN Dashboard: http://127.0.0.1:5000/dhan/callback
```

### Configuration

```bash
# 1. Copy environment template
copy .env.example .env

# 2. Edit .env file
# Add your DHAN credentials:
#   DHAN_CLIENT_ID=your_client_id
#   DHAN_CLIENT_SECRET=your_client_secret
#   SECRET_KEY=your_random_secret_key
```

### OAuth2 Flow Test

**Step 1: Start Backend**
```bash
python dhan_server.py
# Keep running in background
```

**Step 2: Open Application**
```
http://127.0.0.1:5000
# Navigate to: Settings → Connect Broker → DHAN OAuth2 Login
```

**Step 3: Click DHAN OAuth2 Login**
```
Expected:
☐ Popup window opens
☐ Redirects to https://auth.dhan.co/oauth/authorize
☐ Shows login/permission screen
☐ User grants permission
☐ Popup closes and returns to application
☐ Token stored in localStorage
```

**Step 4: Verify Authentication**
```javascript
// Console
localStorage.getItem('dhan_token');
localStorage.getItem('dhan_user');

Expected:
dhan_token: "eyJhbGciOiJIUzI1NiIs..." (JWT token)
dhan_user: {"user_id":"...", "name":"...", ...}
```

**Step 5: Check Connection Status**
```
Navigation → Settings → System Health

Expected:
DHAN Status: ● DHAN Connected
Last sync: < 1 minute ago
Connection: WebSocket active
```

---

## Phase 8D - DHAN API Operations

**Status**: ✅ IMPLEMENTATION COMPLETE (Commit 420216b)

### Prerequisite

✓ DHAN OAuth2 authenticated (see Phase 8C)
✓ Backend running (`python dhan_server.py`)

### API Endpoint Tests

**Test 1: Get Holdings**
```javascript
// Console
await dhanGetHoldings();

Expected response:
{
  "holdings": [
    {
      "symbol": "RELIANCE",
      "quantity": 10,
      "average_price": 2500,
      "current_price": 2650,
      "pnl": 1500
    }
  ]
}
```

**Test 2: Get Positions**
```javascript
// Console
await dhanGetPositions();

Expected response:
{
  "positions": [
    {
      "symbol": "INFY",
      "quantity": 5,
      "entry_price": 1800,
      "current_price": 1850,
      "side": "BUY",
      "pnl": 250
    }
  ]
}
```

**Test 3: Get Account Details**
```javascript
// Console
await dhanGetAccount();

Expected response:
{
  "account": {
    "user_id": "...",
    "balance": 500000,
    "used": 150000,
    "available": 350000,
    "margin_used": 50000
  }
}
```

**Test 4: Get Active Orders**
```javascript
// Console
await dhanGetOrders();

Expected response:
{
  "orders": [
    {
      "order_id": "12345",
      "symbol": "RELIANCE",
      "quantity": 10,
      "price": 2500,
      "status": "OPEN",
      "timestamp": "2026-03-10T14:30:00Z"
    }
  ]
}
```

**Test 5: Place Order (Paper Trading)**
```javascript
// Console (ensure Paper Mode ON)
await dhanPlaceOrder('RELIANCE', 1, 2500, 'LIMIT', 'BUY');

Expected response:
{
  "order_id": "paper_12345",
  "status": "FILLED",
  "symbol": "RELIANCE",
  "quantity": 1,
  "execution_price": 2500,
  "timestamp": "..."
}
```

---

## Phase 8E - WebSocket Real-Time Data

**Status**: ✅ IMPLEMENTATION COMPLETE (Commit 420216b)

### WebSocket Connection Test

```javascript
// Console
console.log('Connected:', socket.connected);
socket.on('market_data', (data) => {
  console.log('Quote:', data);
});
```

Expected:
```
Connected: true
Quote: { symbol: "RELIANCE", price: 2650, bid: 2648, ask: 2652, ... }
```

### Subscribe to Quotes

```javascript
// Console
subscribeToInstruments(['RELIANCE', 'INFY', 'TCS']);

// In Options: Settings → Connected Broker
// Should show: ● Real-time data active
```

Expected:
```
Real-time data updates every 1-2 seconds
Ticker in header updates live
No disconnection messages
```

### Request Single Quote

```javascript
// Console
requestQuote('RELIANCE');

// Should see: Quote modal popup with latest data
// Price, bid/ask, volume, change, etc.
```

---

## Phase 8F - Auto-Sync Portfolio

**Status**: ✅ IMPLEMENTATION COMPLETE (Commit 420216b)

### Sync Behavior

```
Expected: Portfolio auto-syncs every 10 minutes
Location: Dashboard → Watch Summary → Holdings
Updates: Holdings, Positions, Account balance

Manual test:
1. Go to Portfolio tab
2. Note current holdings
3. Place order via DHAN mobile/web
4. Wait 10 seconds OR click "Sync Now" in System Health
5. Portfolio tab updates with new holdings
```

### Monitor Sync Activity

```javascript
// Console
localStorage.getItem('last_dhan_sync');
// Returns: timestamp of last sync

// Manual sync
syncDHANPortfolio();
// Returns: Promise resolving with sync result
```

---

## Phase 8G - Complete Flow Test

**Full Integration Test** (All systems working together)

```bash
Step 1: Start Backend
  Command: python dhan_server.py
  Verify: http://127.0.0.1:5000/api/health returns healthy

Step 2: Open Application  
  URL: http://127.0.0.1:5000
  Verify: All 19 tabs clickable

Step 3: Authenticate with DHAN
  Action: Settings → Connect Broker → DHAN OAuth2 Login
  Verify: Token stored in localStorage
  Status: Shows "● DHAN Connected"

Step 4: Paper Trade
  Action: Execution → Place test order (RELIANCE, 1 share, LIMIT)
  Verify: Order appears in Trade History
  Verify: Portfolio updates (simulation)

Step 5: Check Real-Time Data (Optional - if quotes available)
  Action: Dashboard → Watch Summary
  Verify: Live ticker updates
  Status: WebSocket shows connected

Step 6: Sync Portfolio
  Action: System Health → "Sync Now" button
  Verify: Holdings fetch from DHAN
  Data: Shows holdings/positions from your account

Step 7: Verify Logs
  Action: Activity Log tab
  Verify: All actions recorded (order placements, syncs, logins)
```

---

## ✅ Success Criteria

**Navigation (CRITICAL)**
- [ ] All 19 tabs load instantly
- [ ] No console errors
- [ ] Active tab shows highlight
- [ ] Tab content displays correctly

**Backend Server**
- [ ] Starts without errors
- [ ] Health endpoint returns 200
- [ ] WebSocket connects
- [ ] No terminal errors

**DHAN Integration**
- [ ] OAuth2 popup works
- [ ] Token stores in localStorage
- [ ] Status shows "DHAN Connected"
- [ ] API endpoints accessible

**Real-Time Data**
- [ ] WebSocket receives market data
- [ ] Quotes update live
- [ ] Portfolio auto-syncs
- [ ] No data staleness

**Paper Trading**
- [ ] Orders place instantly
- [ ] Orders fill immediately
- [ ] Portfolio updates
- [ ] Trade history records entry

---

## ❌ Troubleshooting

### Tabs Still Not Clicking

```
1. Hard refresh: Ctrl+Shift+R
2. Check console: F12 → Console
3. Look for red error messages
4. If error about "navigate not defined":
   → File issue with boot() function reload

Expected in console:
✓ No red errors
✓ Message: "Navigation loaded" or similar
```

### Backend Won't Start

```
Error: "Address already in use"
Fix: 
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  python dhan_server.py

Error: "ModuleNotFoundError: No module named 'flask'"
Fix:
  pip install -r requirements.txt

Error: "DHAN credentials not set"
Fix:
  check .env file exists
  contains: DHAN_CLIENT_ID, DHAN_CLIENT_SECRET
```

### WebSocket Not Connecting

```
1. Verify backend running: http://127.0.0.1:5000/api/health
2. Check firewall isn't blocking port 5000
3. Console should show: "WebSocket connected"
4. If not connecting:
   - Restart backend: python dhan_server.py
   - Hard refresh browser: Ctrl+Shift+R
   - Check console for errors (F12)
```

### OAuth2 Popup Issues

```
1. Check .env file has DHAN credentials
2. Verify callback URL set in DHAN dashboard:
   http://127.0.0.1:5000/dhan/callback
3. Clear localStorage: 
   localStorage.clear()
   location.reload()
4. Try again
```

### API Returns 401 Unauthorized

```
Token expired:
- localStorage.removeItem('dhan_token')
- localStorage.removeItem('dhan_token_exp')
- Reauthenticate: Settings → DHAN OAuth2 Login

Verify in console:
localStorage.getItem('dhan_token')
// Should return JWT token starting with "eyJ..."
```

---

## Verification Report Template

```
Date: __________
Tester: __________

Navigation Tabs:
☐ All 19 tabs functional
☐ No console errors
☐ Load time < 100ms each
Result: PASS / FAIL

Backend Server:
☐ Starts without errors
☐ Health endpoint responds
☐ WebSocket initializes
Result: PASS / FAIL

DHAN Integration:
☐ OAuth2 popup works
☐ Token persists
☐ Status shows connected
Result: PASS / FAIL

API Operations:
☐ GetHoldings works
☐ GetOrders works
☐ PlaceOrder works
☐ GetAccount works
Result: PASS / FAIL

Real-Time Data:
☐ WebSocket receives data
☐ Quotes update live
☐ Auto-sync works
Result: PASS / FAIL

Paper Trading:
☐ Order places instantly
☐ Order fills immediately
☐ Portfolio updates
Result: PASS / FAIL

Overall Result: PASS / FAIL

Issues Found:
[list any issues]

Notes:
[any additional observations]
```

---

## Next Steps After Verification

**If All Tests Pass (✅ GREEN):**
1. Application is ready for production use
2. Start live trading (toggle Paper Mode OFF)
3. Monitor for 1 hour before real trades
4. Keep backend running 24/5 for live trading

**If Any Tests Fail (❌ RED):**
1. Document the failing test
2. Check troubleshooting section
3. Report with: test name, expected result, actual result
4. Include browser console screenshot (F12)
5. Include terminal output

---

**Version**: 4.0 | **Last Updated**: Phase 8 | **Status**: ✅ Complete
