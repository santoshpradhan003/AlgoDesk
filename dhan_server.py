"""
AlgoDESK v4 - DHAN Backend Server
Handles OAuth2 authentication, WebSocket connections, and API proxying
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import requests
import json
import os
from datetime import datetime, timedelta
from functools import wraps
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='.', static_url_path='', template_folder='.')
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# DHAN Configuration
DHAN_CONFIG = {
    'base_url': 'https://api.dhan.co/v2',
    'client_id': os.environ.get('DHAN_CLIENT_ID', ''),
    'client_secret': os.environ.get('DHAN_CLIENT_SECRET', ''),
    'redirect_uri': 'http://127.0.0.1:5000/dhan/callback',
    'auth_url': 'https://auth.dhan.co/oauth/authorize',
    'token_url': 'https://api.dhan.co/v2/oauth/token'
}

# Store active WebSocket connections and subscriptions
connected_clients = {}
user_subscriptions = {}

# ═══════════════════════════════════════════════════════════
# ROUTES - Serving HTML & Static Files
# ═══════════════════════════════════════════════════════════

@app.route('/')
def index():
    """Serve main HTML file"""
    return app.send_static_file('algodesk-v4.html')

@app.route('/algodesk-v4.html')
def serve_html():
    """Serve main HTML file"""
    return app.send_static_file('algodesk-v4.html')

@app.route('/TESTING_GUIDE.md')
def serve_testing_guide():
    """Serve testing guide"""
    return app.send_static_file('TESTING_GUIDE.md')

@app.route('/UI_TEST_SUITE.js')
def serve_test_suite():
    """Serve UI test suite"""
    return app.send_static_file('UI_TEST_SUITE.js')

@app.route('/DHAN_API_INTEGRATION.md')
def serve_dhan_docs():
    """Serve DHAN documentation"""
    return app.send_static_file('DHAN_API_INTEGRATION.md')

# ═══════════════════════════════════════════════════════════
# DHAN OAuth2 Authentication
# ═══════════════════════════════════════════════════════════

@app.route('/dhan/login')
def dhan_login():
    """Initiate DHAN OAuth2 login"""
    auth_url = (
        f"{DHAN_CONFIG['auth_url']}?"
        f"client_id={DHAN_CONFIG['client_id']}&"
        f"redirect_uri={DHAN_CONFIG['redirect_uri']}&"
        f"response_type=code&"
        f"scope=trading"
    )
    logger.info(f"Initiating DHAN login: {auth_url}")
    return redirect(auth_url)

@app.route('/dhan/callback')
def dhan_callback():
    """Handle DHAN OAuth2 callback"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    if error:
        logger.error(f"DHAN callback error: {error}")
        return jsonify({'error': f'Authentication failed: {error}'}), 400
    
    if not code:
        logger.error("No authorization code received")
        return jsonify({'error': 'No authorization code'}), 400
    
    try:
        # Exchange code for token
        token_response = requests.post(
            DHAN_CONFIG['token_url'],
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'client_id': DHAN_CONFIG['client_id'],
                'client_secret': DHAN_CONFIG['client_secret'],
                'redirect_uri': DHAN_CONFIG['redirect_uri']
            },
            timeout=10
        )
        
        if token_response.status_code != 200:
            logger.error(f"Token exchange failed: {token_response.text}")
            return jsonify({'error': 'Token exchange failed'}), 400
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        expires_in = token_data.get('expires_in', 3600)
        
        # Store tokens in session
        session['dhan_access_token'] = access_token
        session['dhan_refresh_token'] = refresh_token
        session['dhan_token_expires'] = datetime.now() + timedelta(seconds=expires_in)
        session.permanent = True
        
        logger.info("DHAN authentication successful")
        
        # Redirect to frontend with token in fragment (for security)
        return f'''
        <html>
        <body>
        <script>
            window.opener.postMessage({{
                type: 'DHAN_AUTH_SUCCESS',
                token: '{access_token}',
                refreshToken: '{refresh_token}',
                expiresIn: {expires_in}
            }}, '*');
            window.close();
        </script>
        </body>
        </html>
        '''
    except Exception as e:
        logger.error(f"DHAN callback error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ═══════════════════════════════════════════════════════════
# DHAN API Proxy Routes
# ═══════════════════════════════════════════════════════════

def require_dhan_token(f):
    """Decorator to check for valid DHAN token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = session.get('dhan_access_token')
        if not token:
            return jsonify({'error': 'Not authenticated with DHAN'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/dhan/holdings')
@require_dhan_token
def get_dhan_holdings():
    """Get DHAN holdings"""
    try:
        response = requests.get(
            f"{DHAN_CONFIG['base_url']}/holdings",
            headers={'Authorization': f"Bearer {session.get('dhan_access_token')}"},
            timeout=10
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Get holdings error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dhan/positions')
@require_dhan_token
def get_dhan_positions():
    """Get DHAN positions"""
    try:
        response = requests.get(
            f"{DHAN_CONFIG['base_url']}/positions",
            headers={'Authorization': f"Bearer {session.get('dhan_access_token')}"},
            timeout=10
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Get positions error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dhan/orders')
@require_dhan_token
def get_dhan_orders():
    """Get DHAN orders"""
    try:
        response = requests.get(
            f"{DHAN_CONFIG['base_url']}/orders",
            headers={'Authorization': f"Bearer {session.get('dhan_access_token')}"},
            timeout=10
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Get orders error: {str(e)}")
        return jsonify({'error': str(e)}), 500

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

@app.route('/api/dhan/cancel-order/<order_id>', methods=['DELETE'])
@require_dhan_token
def cancel_dhan_order(order_id):
    """Cancel DHAN order"""
    try:
        response = requests.delete(
            f"{DHAN_CONFIG['base_url']}/orders/{order_id}",
            headers={'Authorization': f"Bearer {session.get('dhan_access_token')}"},
            timeout=10
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Cancel order error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dhan/account')
@require_dhan_token
def get_dhan_account():
    """Get DHAN account info"""
    try:
        response = requests.get(
            f"{DHAN_CONFIG['base_url']}/account",
            headers={'Authorization': f"Bearer {session.get('dhan_access_token')}"},
            timeout=10
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Get account error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ═══════════════════════════════════════════════════════════
# WebSocket Handlers - Real-time Market Data
# ═══════════════════════════════════════════════════════════

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    client_id = request.sid
    connected_clients[client_id] = {
        'id': client_id,
        'connected_at': datetime.now(),
        'subscriptions': []
    }
    logger.info(f"Client connected: {client_id}")
    emit('connection_response', {'status': 'connected', 'client_id': client_id})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    client_id = request.sid
    if client_id in connected_clients:
        del connected_clients[client_id]
    if client_id in user_subscriptions:
        del user_subscriptions[client_id]
    logger.info(f"Client disconnected: {client_id}")

@socketio.on('subscribe_instruments')
def handle_subscribe_instruments(data):
    """Subscribe to real-time data for instruments"""
    client_id = request.sid
    instruments = data.get('instruments', [])  # e.g., ['SBIN', 'INFY', 'TCS']
    
    if client_id not in user_subscriptions:
        user_subscriptions[client_id] = []
    
    user_subscriptions[client_id].extend(instruments)
    
    logger.info(f"Client {client_id} subscribed to: {instruments}")
    emit('subscription_response', {
        'status': 'subscribed',
        'instruments': instruments
    })
    
    # Simulate real-time data (in production, connect to actual DHAN WebSocket)
    broadcast_market_data(instruments)

@socketio.on('unsubscribe_instruments')
def handle_unsubscribe_instruments(data):
    """Unsubscribe from instruments"""
    client_id = request.sid
    instruments = data.get('instruments', [])
    
    if client_id in user_subscriptions:
        user_subscriptions[client_id] = [
            i for i in user_subscriptions[client_id] 
            if i not in instruments
        ]
    
    logger.info(f"Client {client_id} unsubscribed from: {instruments}")
    emit('unsubscription_response', {'status': 'unsubscribed'})

@socketio.on('request_quote')
def handle_request_quote(data):
    """Request live quote for symbol"""
    symbol = data.get('symbol')
    client_id = request.sid
    
    logger.info(f"Quote requested for {symbol}")
    
    # Generate mock quote (replace with real DHAN API call)
    quote = generate_mock_quote(symbol)
    emit('quote_response', {'symbol': symbol, 'quote': quote})

def broadcast_market_data(instruments):
    """Broadcast market data to subscribed clients"""
    for client_id in connected_clients:
        if client_id in user_subscriptions:
            for instrument in instruments:
                if instrument in user_subscriptions[client_id]:
                    quote = generate_mock_quote(instrument)
                    socketio.emit('market_data', {
                        'timestamp': datetime.now().isoformat(),
                        'symbol': instrument,
                        'price': quote['ltp'],
                        'change': quote['change'],
                        'changePercent': quote['changePercent'],
                        'volume': quote['volume'],
                        'bid': quote['bid'],
                        'ask': quote['ask'],
                        'high': quote['high'],
                        'low': quote['low']
                    }, room=client_id)

def generate_mock_quote(symbol):
    """Generate mock market quote (replace with real data)"""
    import random
    base_prices = {
        'SBIN': 600, 'INFY': 1500, 'TCS': 3500, 'HDFC': 2800,
        'RELIANCE': 2800, 'ITC': 450, 'WIPRO': 550, 'BAJFIN': 7800
    }
    base = base_prices.get(symbol, 1000)
    change = random.uniform(-5, 5)
    
    return {
        'symbol': symbol,
        'ltp': base + change,
        'change': change,
        'changePercent': (change / base) * 100,
        'bid': base + change - 0.5,
        'ask': base + change + 0.5,
        'high': base + abs(change) + random.uniform(0, 2),
        'low': base - abs(change) - random.uniform(0, 2),
        'volume': random.randint(100000, 10000000),
        'timestamp': datetime.now().isoformat()
    }

# ═══════════════════════════════════════════════════════════
# Health & Status Endpoints
# ═══════════════════════════════════════════════════════════

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'connected_clients': len(connected_clients),
        'server': 'AlgoDESK v4 Backend',
        'version': '1.0.0'
    })

@app.route('/api/status')
def status():
    """Server status endpoint"""
    return jsonify({
        'status': 'running',
        'timestamp': datetime.now().isoformat(),
        'connected_clients': len(connected_clients),
        'active_subscriptions': sum(
            len(subs) for subs in user_subscriptions.values()
        ),
        'dhan_configured': bool(
            DHAN_CONFIG['client_id'] and DHAN_CONFIG['client_secret']
        )
    })

# ═══════════════════════════════════════════════════════════
# Error Handlers
# ═══════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(e):
    """404 error handler"""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    """500 error handler"""
    logger.error(f"Server error: {str(e)}")
    return jsonify({'error': 'Server error'}), 500

# ═══════════════════════════════════════════════════════════
# Startup & Configuration
# ═══════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║          AlgoDESK v4 - Backend Server                      ║
    ║          DHAN API + WebSocket Integration                  ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    print("📍 Server running at: http://127.0.0.1:5000")
    print("🔐 DHAN OAuth2 configured")
    print("🔌 WebSocket support enabled")
    print("\nSetup instructions:")
    print("1. Export DHAN credentials:")
    print("   export DHAN_CLIENT_ID='your_client_id'")
    print("   export DHAN_CLIENT_SECRET='your_client_secret'")
    print("2. Visit http://127.0.0.1:5000 in your browser")
    print("3. Go to Settings → Connect Broker → DHAN Login")
    print("\nPress Ctrl+C to stop server")
    print("=" * 60 + "\n")
    
    # Run with SocketIO
    socketio.run(app, host='127.0.0.1', port=5000, debug=True)
