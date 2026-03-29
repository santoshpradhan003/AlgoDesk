# AlgoDESK v4 - DHAN Integration Setup Guide

## Quick Start - 5 Minutes

### 1. Install Python Dependencies

```bash
# Navigate to AlgoDesk directory
cd c:\Users\santo\OneDrive\Desktop\AlgoDesk

# Install required packages
pip install -r requirements.txt
```

**Required packages:**
- Flask 2.3.2 - Web framework
- Flask-CORS - Cross-origin requests
- Flask-SocketIO 5.3.4 - WebSocket support
- python-socketio - Socket.IO client/server
- requests - HTTP library
- dhanhq 0.2.0 - Official DHAN Python library
- python-dotenv - Environment variables

### 2. Configure DHAN API Credentials

Create `.env` file in the AlgoDesk directory:

```bash
# .env file (DO NOT COMMIT TO GIT)
DHAN_CLIENT_ID=your_client_id_from_dhan_dashboard
DHAN_CLIENT_SECRET=your_client_secret_from_dhan_dashboard
SECRET_KEY=your-secret-flask-key
```

**Where to get credentials:**
1. Go to https://www.dhan.co/
2. Login to your account
3. Settings → API & Integration → Create New App
4. Copy **Client ID** and **Client Secret**
5. Set Redirect URL to: `http://127.0.0.1:5000/dhan/callback`

### 3. Start the Backend Server

```bash
# From AlgoDesk directory
python dhan_server.py
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║          AlgoDESK v4 - Backend Server                      ║
║          DHAN API + WebSocket Integration                  ║
╚════════════════════════════════════════════════════════════╝

📍 Server running at: http://127.0.0.1:5000
🔐 DHAN OAuth2 configured
🔌 WebSocket support enabled
```

### 4. Open Application

Open in your browser:
```
http://127.0.0.1:5000
```

### 5. Connect DHAN Broker

In the application:
1. Go to **Settings → Broker Connection**
2. Click **DHAN** button
3. Click **OAuth2 Login**
4. Login with your DHAN credentials (new window opens)
5. Authorize the application
6. Automatic redirect back to AlgoDESK with token
7. Status shows "✓ Connected to DHAN"

---

## Architecture Overview

### Backend Components

```
dhan_server.py
├── Flask App (http://127.0.0.1:5000)
├── OAuth2 Handler (/dhan/login, /dhan/callback)
├── REST API Proxy (/api/dhan/*)
├── WebSocket Server (real-time market data)
└── Session Management (token storage)
```

### Frontend Components

```
algodesk-v4.html
├── WebSocket Client (socket.io)
├── OAuth2 Window Handler
├── Real-time Quote Updates
├── Order Streaming
└── Portfolio Sync
```

### Data Flow

```
User Action
    ↓
Frontend Form
    ↓
API Request → Flask Backend
    ↓
DHAN API (https://api.dhan.co/v2)
    ↓
Response → Frontend Update
```

---

## DHAN OAuth2 Authentication Flow

### Step-by-Step

1. **User clicks "DHAN OAuth2 Login"**
   ```
   Frontend → window.open('/dhan/login')
   ```

2. **Backend redirects to DHAN auth URL**
   ```
   https://auth.dhan.co/oauth/authorize?
   client_id=YOUR_ID&
   redirect_uri=http://127.0.0.1:5000/dhan/callback&
   response_type=code&
   scope=trading
   ```

3. **User grants permission on DHAN website**

4. **DHAN redirects back to callback**
   ```
   http://127.0.0.1:5000/dhan/callback?code=AUTH_CODE
   ```

5. **Backend exchanges code for token**
   ```python
   POST https://api.dhan.co/v2/oauth/token
   {
     "grant_type": "authorization_code",
     "code": AUTH_CODE,
     "client_id": CLIENT_ID,
     "client_secret": CLIENT_SECRET,
     "redirect_uri": CALLBACK_URL
   }
   ```

6. **Access token stored in session**
   ```
   session['dhan_access_token'] = 'access_token_value'
   session['dhan_refresh_token'] = 'refresh_token_value'
   ```

7. **Frontend notified of success**
   ```javascript
   window.opener.postMessage({
     type: 'DHAN_AUTH_SUCCESS',
     token: 'access_token',
     refreshToken: 'refresh_token'
   })
   ```

---

## API Endpoints

### Authentication
- **GET** `/dhan/login` - Start OAuth2 flow
- **GET** `/dhan/callback` - Receive auth code & exchange for token

### Orders
- **GET** `/api/dhan/orders` - Get all orders
- **POST** `/api/dhan/place-order` - Place new order
- **DELETE** `/api/dhan/cancel-order/<order_id>` - Cancel order

### Portfolio
- **GET** `/api/dhan/holdings` - Get holdings (T+1 and older)
- **GET** `/api/dhan/positions` - Get intraday positions
- **GET** `/api/dhan/account` - Account balance & margin

### Status
- **GET** `/api/health` - Server health check
- **GET** `/api/status` - Connected clients & subscriptions

---

## WebSocket Events

### Client → Server

**Connect**
```javascript
socket.on('connect', () => {
  console.log('Connected to backend');
});
```

**Subscribe to Instruments**
```javascript
socket.emit('subscribe_instruments', {
  instruments: ['SBIN', 'INFY', 'TCS']
});
```

**Request Quote**
```javascript
socket.emit('request_quote', {
  symbol: 'RELIANCE'
});
```

### Server → Client

**Market Data** (real-time updates)
```javascript
socket.on('market_data', (data) => {
  console.log(data); // {symbol, price, change, volume, bid, ask}
});
```

**Quote Response**
```javascript
socket.on('quote_response', (data) => {
  console.log(data); // {symbol, quote}
});
```

---

## Example: Place Order via API

### JavaScript Frontend

```javascript
async function placeOrderVia DHAN(symbol, qty, price, orderType) {
  try {
    const response = await fetch('/api/dhan/place-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        quantity: qty,
        price: price,
        orderType: orderType, // 'MARKET' or 'LIMIT'
        side: 'BUY', // or 'SELL'
        productType: 'MIS', // or 'CNC'
        exchange: 'NSE' // or 'BSE'
      })
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('Order placed:', result.orderId);
      toast(`✓ Order placed: ${result.orderId}`, 'var(--accent)');
    } else {
      console.error('Order failed:', result.error);
      toast(`✗ ${result.error}`, 'var(--danger)');
    }
  } catch(e) {
    console.error('Order error:', e);
    toast('Network error', 'var(--danger)');
  }
}
```

### Python Backend (in dhan_server.py)

```python
@app.route('/api/dhan/place-order', methods=['POST'])
@require_dhan_token
def place_dhan_order():
    """Place DHAN order"""
    try:
        order_data = request.json
        response = requests.post(
            f"{DHAN_CONFIG['base_url']}/orders/regular",
            json=order_data,
            headers={'Authorization': f"Bearer {session.get('dhan_access_token')}"},
            timeout=10
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Place order error: {str(e)}")
        return jsonify({'error': str(e)}), 500
```

---

## Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
netstat -an | findstr 5000

# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### DHAN credentials not working
1. Verify credentials in `.env` file
2. Check DHAN dashboard for correct Client ID/Secret
3. Ensure Redirect URL is exactly: `http://127.0.0.1:5000/dhan/callback`

### Backend shows "Not authenticated"
- Check that you completed OAuth2 login
- Verify token is stored in browser session
- Check browser console for errors

### WebSocket not connecting
- Ensure backend server is running
- Check firewall allows connections to port 5000
- Browser console should show: "Connected to backend"

### Orders not executing
- Verify paper mode is OFF (for live trading)
- Check available margin in Account Info
- Confirm symbol is valid (case-sensitive)
- Check circuit breaker status in logs

---

## Production Deployment

### Using Gunicorn (Linux/Mac)

```bash
pip install gunicorn
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 dhan_server:app
```

### Using Waitress (Windows)

```bash
pip install waitress
waitress-serve --port=5000 dhan_server:app
```

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "dhan_server.py"]
```

### Environment Variables

Set in production:

```bash
export DHAN_CLIENT_ID="prod_client_id"
export DHAN_CLIENT_SECRET="prod_client_secret"
export SECRET_KEY="prod_secret_key"
export FLASK_ENV="production"
```

---

## Security Recommendations

1. **Never commit `.env` file to Git**
   - Add `.env` to `.gitignore`

2. **Use HTTPS in production**
   - Configure SSL certificates
   - Update redirect URL to `https://yourdomain.com/dhan/callback`

3. **Secure token storage**
   - Use secure session cookies
   - Enable HttpOnly flag
   - Use SameSite=Lax

4. **Rate limiting**
   - Add rate limiter to API endpoints
   - Respect DHAN's 100 req/min limit

5. **Logging & Monitoring**
   - Log all API calls
   - Monitor WebSocket connections
   - Alert on errors

---

## Testing

### Browser Console Tests

```javascript
// Test WebSocket connection
socket.connected // Should be true

// Test real-time quotes
socket.emit('subscribe_instruments', {
  instruments: ['SBIN', 'INFY']
});

// Test API
fetch('/api/dhan/account')
  .then(r => r.json())
  .then(console.log);
```

### Backend Health Check

```bash
curl http://127.0.0.1:5000/api/health
# Should return: {"status":"healthy","connected_clients":N,...}
```

---

## Resources

- **DHAN API Docs**: https://docs.dhan.co/
- **DHAN OAuth2**: https://docs.dhan.co/oauth2
- **Socket.IO**: https://socket.io/
- **Flask-SocketIO**: https://flask-socketio.readthedocs.io/

---

## Support

For issues:
1. Check server logs: Look for error messages in terminal
2. Check browser console: F12 → Console tab
3. Enable debug logging in `dhan_server.py`
4. Contact DHAN support with order/transaction IDs

---

**Last Updated**: March 2026  
**Version**: AlgoDESK v4 with DHAN WebSocket  
**Backend**: Flask + SocketIO + DHAN API v2
