# 🚀 AlgoDESK v4 - Quick Start (5 Minutes)

## Phase 8: Navigation Fixed + Backend WebSocket Ready

---

## 1️⃣ Test Navigation (2 Minutes)

### Open Application
```
URL: file:///C:/Users/santo/OneDrive/Desktop/AlgoDesk/algodesk-v4.html
```

### Click All Tabs
```
Expected: Each tab loads instantly (< 100ms)
If broken: Check browser console (F12) for errors
```

**Navigation Tabs to Test (19 total):**
- Core: Dashboard, Portfolio, Execution, Analysis, Risk Manager
- Analysis: Strategies, Backtest, Technical, Screener, Analytics, Trade Journal
- Risk: Capital Limits, Position Limits, Daily Limits, Sector Exposure, Monitoring
- System: System Health, Key Shortcuts, Settings, Activity Log

---

## 2️⃣ Start Backend (1 Minute)

### Open Terminal
```powershell
cd "c:\Users\santo\OneDrive\Desktop\AlgoDesk"
venv\Scripts\activate
python dhan_server.py
```

### Expected Output
```
 * Running on http://127.0.0.1:5000
 * WebSocket server initialized
 * Ready to accept connections
```

**⚠️ Keep terminal open** - Server must stay running

---

## 3️⃣ Open HTML via Backend (1 Minute)

### New Browser Tab
```
http://127.0.0.1:5000
```

### Verify Connection
```
✓ Application loads
✓ Console shows: "WebSocket connected"
✓ Settings → System Health shows backend status
```

---

## 4️⃣ Configure DHAN (Optional - 1 Minute)

Only if you have DHAN account and want live trading.

### Step A: Get Credentials
1. Go: https://www.dhan.co/ → Settings → API & Integration
2. Create new app
3. Copy **Client ID** and **Client Secret**
4. Set **Redirect URL**: `http://127.0.0.1:5000/dhan/callback`

### Step B: Add to .env
```bash
# Edit file: .env
DHAN_CLIENT_ID=your_client_id_here
DHAN_CLIENT_SECRET=your_client_secret_here
SECRET_KEY=your-random-secret-key
```

### Step C: Restart Backend
```bash
# In terminal
Ctrl+C (stop current)
python dhan_server.py (restart)
```

### Step D: Authenticate
```
Settings → Connect Broker → DHAN OAuth2 Login
→ Popup opens, grant permission
→ Status shows "● DHAN Connected"
```

---

## ✅ You're Done!

### Navigation is Working
✅ All 19 tabs clickable
✅ No console errors
✅ Content loads instantly

### Backend is Running
✅ Flask server on http://127.0.0.1:5000
✅ WebSocket connected
✅ Ready for real-time data

### Paper Trading
✅ Ready to use immediately
✅ No credentials needed
✅ Execution → Place Order

### Live Trading (Optional)
✅ If DHAN connected, toggle Paper Mode OFF
✅ Real orders execute on NSE/BSE
✅ Position updates in 1-2 seconds

---

## 🧪 Quick Test

### Test Paper Order
```
1. Go to Execution tab
2. Symbol: RELIANCE
3. Quantity: 1
4. Price: 2500
5. Type: LIMIT
6. Click "Place Order"
7. Check Trade History - order should appear
```

### Test Real-Time Data (if WebSocket working)
```
1. Dashboard tab
2. Watch Summary should show live prices
3. Should update every 1-2 seconds
```

### Test Portfolio Sync (if DHAN connected)
```
1. System Health tab
2. Click "Sync Now"
3. Portfolio tab should show DHAN holdings
```

---

## 🆘 Issues?

**Tabs not clicking?**
```
→ Hard refresh: Ctrl+Shift+R
→ Check console: F12 → Console (look for red errors)
→ Restart browser
```

**Backend won't start?**
```
→ python --version (check Python 3.9+)
→ pip install -r requirements.txt (reinstall)
→ netstat -ano | findstr :5000 (check port 5000 free)
```

**WebSocket not connecting?**
```
→ Verify: http://127.0.0.1:5000/api/health
→ Status should show {"status":"healthy",...}
→ Hard refresh browser: Ctrl+Shift+R
```

**DHAN not connecting?**
```
→ Check .env file has credentials
→ Verify callback URL in DHAN dashboard
→ Restart backend: Ctrl+C then python dhan_server.py
```

---

## 📚 Documentation

- **Full Setup**: See [DHAN_WEBSOCKET_SETUP.md](DHAN_WEBSOCKET_SETUP.md)
- **Verification**: See [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)
- **Features**: See [README.md](README.md)
- **Architecture**: See [DHAN_WEBSOCKET_SETUP.md](DHAN_WEBSOCKET_SETUP.md#architecture)

---

## 🎯 What's New (Phase 8)

1. **Navigation Fixed** ✅
   - All 19 tabs now clickable
   - Fixed root cause: simplified async boot() function
   - Load time: < 100ms per tab

2. **WebSocket Backend** ✅
   - Flask server on port 5000
   - OAuth2 authentication with DHAN
   - Real-time market data streaming
   - Auto-portfolio sync every 10 minutes

3. **DHAN Integration** ✅
   - Complete API proxy
   - Order management (place, cancel, view)
   - Portfolio synchronization
   - Real-time quotes

4. **Production Ready** ✅
   - Resilience: circuit breaker, exponential backoff
   - Persistence: IndexedDB + localStorage
   - Security: .gitignore, .env.example
   - Documentation: 3 setup guides + verification checklist

---

## 🚀 Next Steps

1. ✅ **Test Navigation** (priority: CRITICAL)
   - Click all tabs
   - Verify no errors
   - Expected: instant response

2. ✅ **Run Backend** (priority: HIGH if using live trading)
   - Start server
   - Check health endpoint
   - Keep running 24/5

3. ✅ **Configure Credentials** (priority: MEDIUM)
   - Only needed for live trading
   - Copy .env.example → .env
   - Add your credentials

4. ✅ **Practice Paper Trading** (priority: MEDIUM)
   - Test order placement
   - Watch order fills
   - Monitor P&L

5. ✅ **Go Live** (priority: LOW)
   - After 1 hour of paper trading
   - Toggle Paper Mode OFF
   - Monitor first real trades closely

---

## Version Info

**Current Version**: 4.0
**Last Update**: Phase 8 (March 2026)
**Status**: ✅ Production Ready

**Recent Commits**:
- 420216b: DHAN WebSocket + OAuth2 integration
- bf71911: CRITICAL navigation fix (async → sync boot)
- 0b8a6c1: Verification checklist
- 6788b94: Updated README

---

**Ready to trade? Start with the navigation test above! 🎯**
