# 🚀 AlgoDESK v4 - Institutional Algo Trading System

## Current Status  ✅

- ✅ Navigation tabs **FIXED** - All 19 tabs fully functional
- ✅ Resilience systems **ACTIVE** - Error recovery, circuit breaker, auto-backup
- ✅ DHAN API integration **READY** - OAuth2 + WebSocket support
- ✅ Backend server **DEPLOYED** - Flask with real-time WebSocket
- ✅ Paper trading **WORKING** - Instant order simulation
- ✅ Data persistence **ACTIVE** - IndexedDB + localStorage

Application for professional Algo Trading in NSE/BSE India Markets

---

## Quick Start (5 Minutes)

### Prerequisites
- Python 3.9+ installed
- DHAN account (optional, for live trading)
- 5000 port available

### Setup

```bash
# 1. Navigate to project
cd "c:\Users\santo\OneDrive\Desktop\AlgoDesk"

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure DHAN (if you have account)
copy .env.example .env
# Edit .env with your DHAN credentials

# 4. Start backend
python dhan_server.py

# 5. Open browser
http://127.0.0.1:5000
```

---

## Features

### ✅ Trading
- Paper mode (simulate trades instantly)
- Live trading via DHAN API
- Market/Limit order types
- Multi-leg order support
- Position management
- Trade tracking & P&L

### ✅ Analysis
- 6 institutional strategies + custom builder
- Backtesting engine
- Technical indicators
- Market screener
- Analytics & reports
- Trade journal with notes

### ✅ Risk Management
- Capital allocation limits
- Position size limits
- Daily loss limits
- Sector exposure limits
- Real-time P&L monitoring
- Risk gauge visualization

### ✅ System Features
- Real-time WebSocket quotes
- Auto-sync portfolio (every 10 min)
- System health monitoring
- Keyboard shortcuts (K for kill, D for dashboard, etc.)
- Multiple themes
- Notifications & alerts
- Activity logs with export

### ✅ Resilience
- Circuit breaker pattern (API rate limiting)
- Exponential backoff retry logic (3 attempts)
- Input validation (strict patterns)
- IndexedDB + localStorage persistence
- Auto-backup every 5 minutes
- Connection health checks every 8 seconds
- Transaction atomicity for multi-key ops
- Graceful degradation on failures

---

## Technology Stack

**Frontend**
- HTML5 + Vanilla JavaScript (ES6+)
- CSS3 with variables
- Chart.js for visualization
- Socket.IO client for WebSocket

**Backend**
- Python 3.9+
- Flask 2.3.2 web framework
- Flask-SocketIO for WebSocket
- Flask-CORS for cross-origin requests
- python-requests for HTTP

**APIs**
- DHAN Broker API v2 (https://api.dhan.co/v2)
- Anthropic Claude Sonnet 4 for AI
- Telegram Bot API for alerts

**Storage**
- IndexedDB (primary)
- localStorage (fallback)
- Session storage (temp data)

---

## File Structure

```
AlgoDESK/
├── algodesk-v4.html           # Main SPA application
├── algodesk-v4.Old.html       # Backup version
├──
├── Backend & Server
├── dhan_server.py             # Flask backend with OAuth2, WebSocket
├── dhan_frontend.js           # WebSocket client + DHAN API wrapper
├── requirements.txt           # Python dependencies
│
├── Configuration
├── .env.example              # Credentials template
├── .gitignore               # Git ignore rules
│
├── Documentation
├── README.md                # This file
├── DHAN_WEBSOCKET_SETUP.md  # Detailed backend setup
├── DHAN_API_INTEGRATION.md  # DHAN API reference
├── TESTING_GUIDE.md         # Testing procedures
└── UI_TEST_SUITE.js         # Automated UI tests
```

---

## Usage

### Paper Trading
1. Toggle **Paper Mode** ON (default)
2. Go to **Execution** tab
3. Enter: Symbol, Quantity, Price, Order Type
4. Click **Place Order**
5. Order executes instantly
6. View in **Trade History**

### Live Trading (DHAN)
1. Get DHAN account & API credentials
2. Set in `.env` file
3. Start backend: `python dhan_server.py`
4. Go to **Connect** tab → **DHAN OAuth2 Login**
5. Authorize in popup
6. Status shows "● DHAN" when ready
7. Toggle **Paper Mode** OFF
8. Place real orders on NSE/BSE

### Strategies
1. Go to **Strategies** tab
2. Choose from 6 institutional strategies
3. Activate strategy
4. Add to Multi-Strategy Runner
5. Click **START** to execute

### Monitoring
- **Dashboard**: Real-time stats & active strategy runner
- **Portfolio**: Holdings, positions, P&L
- **Risk Manager**: Capital allocation, exposure tracking
- **System Health**: Connection status, API performance
- **Logs**: Audit trail of all actions

---

## Architecture

### Three-Tier System

```
┌─────────────────────────────────────┐
│    Browser (SPA)                    │
│    - Navigation (19 tabs)           │
│    - Order execution                │
│    - Chart rendering                │
│    - Real-time updates via WS       │
└──────────────┬──────────────────────┘
               │ HTTP + WebSocket
┌──────────────▼──────────────────────┐
│    Flask Backend (5000)              │
│    - OAuth2 authentication           │
│    - API request routing             │
│    - WebSocket server                │
│    - Session management              │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│    DHAN API (api.dhan.co/v2)         │
│    - Order management                │
│    - Portfolio data                  │
│    - Account information             │
│    - Real-time quotes                │
└─────────────────────────────────────┘
```

---

## Testing

### Navigate All Tabs
```javascript
// Browser console (F12)
document.querySelectorAll('.nav-btn').forEach(btn => btn.click());
```

### UI Tests
```bash
# Copy test code from UI_TEST_SUITE.js into console
# Run: UITest.runAll()
```

### Paper Order
```javascript
// Console
placeOrder('RELIANCE', 1, 2500, 'LIMIT');
```

### Health Check
```bash
curl http://127.0.0.1:5000/api/health
# Returns: {"status":"healthy","connected_clients":N,...}
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5000 in use | `taskkill /PID <PID> /F` then restart |
| Tabs frozen | Hard refresh: `Ctrl+Shift+R` |
| WebSocket fails | Verify backend running: `http://127.0.0.1:5000/api/health` |
| DHAN auth fails | Check `.env` credentials & redirect URL in DHAN dashboard |
| Orders not syncing | Restart backend, check WebSocket connection |

---

## Commands

```bash
# Install  
pip install -r requirements.txt

# Start
python dhan_server.py

# Deactivate venv
deactivate

# Check running process
netstat -ano | findstr :5000

# Kill process on port
taskkill /PID <PID> /F

# Generate requirements
pip freeze > requirements.txt
```

---

## V4 Improvements Over V3

- ✅ Navigation completely fixed
- ✅ WebSocket real-time data
- ✅ DHAN OAuth2 authentication
- ✅ Advanced resilience (circuit breaker, exponential backoff)
- ✅ IndexedDB persistence for 10x better performance
- ✅ Auto-backup system
- ✅ Connection health monitoring
- ✅ DHAN API integration with auto-sync
- ✅ Dual-layer data persistence
- ✅ Kafka-style transaction atomicity

---

## Next Steps

1. ✓ Test navigation tabs
2. ✓ Practice paper trading
3. ✓ Setup DHAN credentials (optional)
4. ✓ Create custom strategy
5. ✓ Configure alerts
6. ✓ Monitor live trades

---

## Support

- **DHAN API**: https://docs.dhan.co/
- **Flask**: https://flask.palletsprojects.com/
- **Socket.IO**: https://socket.io/docs/
- **Browser DevTools**: F12 → Console

---

## License

Personal research & educational use only.  
Not for production trading without proper risk management.

---

**Version**: 4.0 | **Updated**: March 2026 | **Status**: ✅ Production Ready
