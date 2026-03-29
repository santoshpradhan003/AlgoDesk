/**
 * DHAN WebSocket & OAuth2 Integration
 * Add this to algodesk-v4.html before </script> tag
 */

// ═══════════════════════════════════════════════════════════
// WEBSOCKET CONNECTION
// ═══════════════════════════════════════════════════════════

let socket = null;
let dhanAuth = {
  clientId: '',
  accessToken: '',
  refreshToken: '',
  expiresAt: null,
  connected: false
};

function initWebSocket() {
  if (socket) return; // Already connected
  
  try {
    socket = io();
    
    socket.on('connect', () => {
      console.log('✓ WebSocket connected to backend');
      A.wsConnected = true;
      addLog('INFO', '✓ WebSocket connected');
      updateConnectionStatus();
    });
    
    socket.on('disconnect', () => {
      console.log('✗ WebSocket disconnected');
      A.wsConnected = false;
      addLog('WARN', '⚠ WebSocket disconnected');
      updateConnectionStatus();
    });
    
    socket.on('market_data', (data) => {
      handleMarketData(data);
    });
    
    socket.on('quote_response', (data) => {
      handleQuoteResponse(data);
    });
    
    socket.on('subscription_response', (data) => {
      console.log('Subscribed to instruments:', data.instruments);
      toast(`✓ Tracking ${data.instruments.length} instruments`, 'var(--blue)');
    });
    
    socket.on('order_update', (data) => {
      handleOrderUpdate(data);
    });
    
  } catch(e) {
    console.error('WebSocket init error:', e);
    addLog('ERROR', 'WebSocket initialization failed: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// DHAN OAUTH2 AUTHENTICATION
// ═══════════════════════════════════════════════════════════

function dhanOAuth2Login() {
  try {
    // Open OAuth2 login in new window
    const loginWindow = window.open('/dhan/login', 'dhan_auth', 'width=600,height=700');
    
    // Listen for auth success message from popup
    window.addEventListener('message', function handleAuthMessage(event) {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'DHAN_AUTH_SUCCESS') {
        console.log('✓ DHAN OAuth2 successful');
        
        // Store tokens
        dhanAuth.accessToken = event.data.token;
        dhanAuth.refreshToken = event.data.refreshToken;
        dhanAuth.expiresAt = new Date(Date.now() + event.data.expiresIn * 1000);
        dhanAuth.connected = true;
        
        // Persist to localStorage
        localStorage.setItem('dhan_auth', JSON.stringify(dhanAuth));
        
        addLog('SUCCESS', '✓ DHAN authentication successful');
        toast('✓ Connected to DHAN', 'var(--accent)');
        updateConnectionStatus();
        renderConnectPage();
        
        // Close popup window
        loginWindow.close();
        
        // Remove listener
        window.removeEventListener('message', handleAuthMessage);
      }
    });
    
  } catch(e) {
    console.error('OAuth2 login error:', e);
    toast('OAuth2 login failed', 'var(--danger)');
    addLog('ERROR', 'OAuth2 login error: ' + e.message);
  }
}

function loadDHANAuth() {
  try {
    const stored = localStorage.getItem('dhan_auth');
    if (stored) {
      const auth = JSON.parse(stored);
      // Check if token not expired
      if (auth.expiresAt && new Date(auth.expiresAt) > new Date()) {
        dhanAuth = auth;
        dhanAuth.connected = true;
        console.log('✓ DHAN auth loaded from storage');
        return true;
      }
    }
  } catch (e) {
    console.error('Load auth error:', e);
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
// DHAN API CALLS (via Flask Backend)
// ═══════════════════════════════════════════════════════════

async function dhanAPICall(endpoint, method = 'GET', body = null) {
  try {
    if (!dhanAuth.accessToken) {
      throw new Error('Not authenticated with DHAN');
    }
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dhanAuth.accessToken}`
      }
    };
    
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(endpoint, options);
    
    if (response.status === 401) {
      // Token expired
      dhanAuth.connected = false;
      localStorage.removeItem('dhan_auth');
      throw new Error('DHAN token expired - please reconnect');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API call failed');
    }
    
    return data;
    
  } catch(e) {
    console.error('API error:', e);
    addLog('ERROR', `DHAN API error: ${e.message}`);
    throw e;
  }
}

async function dhanGetHoldings() {
  return await dhanAPICall('/api/dhan/holdings');
}

async function dhanGetPositions() {
  return await dhanAPICall('/api/dhan/positions');
}

async function dhanGetOrders() {
  return await dhanAPICall('/api/dhan/orders');
}

async function dhanGetAccount() {
  return await dhanAPICall('/api/dhan/account');
}

async function dhanPlaceOrder(symbol, qty, price, orderType, side = 'BUY') {
  const orderData = {
    symbol: symbol.toUpperCase(),
    quantity: parseInt(qty),
    price: parseFloat(price),
    orderType: orderType.toUpperCase(), // 'MARKET' or 'LIMIT'
    side: side.toUpperCase(), // 'BUY' or 'SELL'
    productType: 'MIS', // Margin Intraday
    exchange: 'NSE'
  };
  
  return await dhanAPICall('/api/dhan/place-order', 'POST', orderData);
}

async function dhanCancelOrder(orderId) {
  return await dhanAPICall(`/api/dhan/cancel-order/${orderId}`, 'DELETE');
}

// ═══════════════════════════════════════════════════════════
// WEBSOCKET SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

function subscribeToInstruments(symbols) {
  if (!socket || !socket.connected) {
    console.warn('WebSocket not connected');
    return;
  }
  
  socket.emit('subscribe_instruments', {
    instruments: Array.isArray(symbols) ? symbols : [symbols]
  });
  
  console.log('Subscribed to:', symbols);
}

function requestQuote(symbol) {
  if (!socket || !socket.connected) {
    console.warn('WebSocket not connected');
    return;
  }
  
  socket.emit('request_quote', { symbol: symbol.toUpperCase() });
}

// ═══════════════════════════════════════════════════════════
// HANDLE INCOMING DATA
// ═══════════════════════════════════════════════════════════

function handleMarketData(data) {
  // Real-time market data from WebSocket
  console.log(`${data.symbol}: ₹${data.price.toFixed(2)} ${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}`);
  
  // Update Live Ticker
  const tickerEl = document.querySelector(`[data-symbol="${data.symbol}"]`);
  if (tickerEl) {
    tickerEl.innerHTML = `
      <span class="t-sym">${data.symbol}</span>
      <span class="t-val">₹${data.price.toFixed(2)}</span>
      <span class="t-chg" style="color:${data.change >= 0 ? 'var(--accent)' : 'var(--danger)'}">${data.change >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%</span>
    `;
  }
  
  // Update chart if open
  if (A.charts.ohlc && A.charts.ohlc.data) {
    updateOHLCChart(data);
  }
}

function handleQuoteResponse(data) {
  console.log('Quote received:', data);
  
  // Display in modal or panel
  if (el('quote-modal')) {
    el('quote-symbol').textContent = data.symbol;
    el('quote-price').textContent = `₹${data.quote.ltp.toFixed(2)}`;
    el('quote-change').textContent = `${data.quote.change >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}%`;
    el('quote-volume').textContent = data.quote.volume.toLocaleString();
    el('quote-bid').textContent = `₹${data.quote.bid.toFixed(2)}`;
    el('quote-ask').textContent = `₹${data.quote.ask.toFixed(2)}`;
  }
}

function handleOrderUpdate(data) {
  // Real-time order status updates
  console.log('Order update:', data);
  
  if (data.status === 'filled') {
    addNotif('ORDER', `✓ Order filled: ${data.symbol} ${data.quantity} @ ₹${data.price}`, 'var(--accent)');
    addLog('TRADE', `Order filled: ${data.symbol}`);
  } else if (data.status === 'cancelled') {
    addNotif('ORDER', `✗ Order cancelled: ${data.orderId}`, 'var(--warn)');
    addLog('INFO', `Order cancelled: ${data.orderId}`);
  } else if (data.status === 'rejected') {
    addNotif('ORDER', `⚠ Order rejected: ${data.reason}`, 'var(--danger)');
    addLog('ERROR', `Order rejected: ${data.reason}`);
  }
  
  // Refresh order list
  if (typeof renderOrderBook === 'function') {
    renderOrderBook();
  }
}

// ═══════════════════════════════════════════════════════════
// UI UPDATES
// ═══════════════════════════════════════════════════════════

function updateConnectionStatus() {
  const badge = el('hdr-broker-badge');
  if (!badge) return;
  
  if (dhanAuth.connected) {
    badge.style.display = 'inline-block';
    badge.textContent = '● DHAN';
    badge.style.background = 'rgba(0, 212, 255, 0.1)';
    badge.style.color = 'var(--blue)';
    badge.style.borderColor = 'rgba(0, 212, 255, 0.2)';
    badge.title = 'Connected to DHAN';
  } else {
    badge.style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════
// SYNC PORTFOLIO FROM DHAN
// ═══════════════════════════════════════════════════════════

async function syncDHANPortfolio() {
  if (!dhanAuth.connected) {
    toast('Not connected to DHAN', 'var(--warn)');
    return;
  }
  
  try {
    addLog('INFO', '🔄 Syncing portfolio from DHAN...');
    
    const [holdings, positions, account] = await Promise.all([
      dhanGetHoldings(),
      dhanGetPositions(),
      dhanGetAccount()
    ]);
    
    // Update global state
    A.portfolio = holdings.holdings || [];
    A.positions = positions.positions || [];
    A.riskCfg.capital = account.balance?.availableBalance || A.riskCfg.capital;
    
    // Persist
    if (typeof saveData === 'function') {
      await saveData('v4_pf', A.portfolio);
      await saveData('v4_pos', A.positions);
    }
    
    // Re-render
    if (typeof renderPortfolio === 'function') {
      renderPortfolio();
    }
    if (typeof updateDashboard === 'function') {
      updateDashboard();
    }
    
    addLog('SUCCESS', '✓ Portfolio synced from DHAN');
    toast('✓ Portfolio synced', 'var(--accent)');
    
  } catch(e) {
    console.error('Sync error:', e);
    addLog('ERROR', `Portfolio sync failed: ${e.message}`);
    toast('Sync failed', 'var(--danger)');
  }
}

// Auto-sync every 10 minutes
setInterval(() => {
  if (dhanAuth.connected && A.botActive) {
    syncDHANPortfolio().catch(console.error);
  }
}, 600000);

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

// Load saved DHAN auth when page loads
window.addEventListener('load', () => {
  loadDHANAuth();
  initWebSocket();
  updateConnectionStatus();
  
  // Subscribe to watchlist symbols
  if (A.watchlist.length > 0) {
    const symbols = A.watchlist.map(w => w.symbol);
    subscribeToInstruments(symbols);
  }
});

console.log('✓ DHAN WebSocket & OAuth2 module loaded');
