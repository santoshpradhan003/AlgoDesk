# DHAN API Integration for AlgoDESK v4

## Overview
AlgoDESK v4 now includes native integration with **DHAN Broker API** for live trading, order management, and portfolio synchronization.

**DHAN Base URL**: `https://api.dhan.co/v2`

## Setup Instructions

### 1. Create DHAN Account & API Credentials
1. Visit https://www.dhan.co/
2. Sign up for a trading account
3. Navigate to **Settings → Partner API → Create App**
4. Generate **Client ID** and **Secret Key**
5. Copy and save these credentials securely

### 2. Connect in AlgoDESK v4
1. Open the application in your browser
2. Go to **Settings → Broker Connection**
3. Click **"Dhan"** button
4. Enter your DHAN credentials:
   - **API Key**: Your Secret Key
   - **API Secret**: Your Client ID
5. Click **Connect**
6. System will authenticate and show confirmation

## API Integration Features

### ✅ Implemented Functions

#### Authentication
- `dhanAuth()` - Authenticate with DHAN API
- Automatic token management & storage
- Token persistence across sessions

#### Order Management
- `dhanPlaceOrder(symbol, qty, price, orderType, side)` - Place new orders
  - **symbol**: Stock symbol (e.g., "SBIN", "INFY")
  - **qty**: Order quantity
  - **price**: For LIMIT orders (0 for MARKET)
  - **orderType**: "MARKET" or "LIMIT"
  - **side**: "BUY" or "SELL"
  
- `dhanModifyOrder(orderId, qty, price)` - Modify pending orders
- `dhanCancelOrder(orderId)` - Cancel pending orders

#### Portfolio & Account Data
- `dhanGetHoldings()` - Fetch all holdings (T+1 and older)
- `dhanGetPositions()` - Get intraday position details with P&L
- `dhanGetOrders()` - Fetch order history and status
- `dhanGetAccount()` - Account balance, equity, margin info

#### Portfolio Sync
- `syncDhanPortfolio()` - Auto-sync holdings from DHAN to AlgoDESK
  - Runs every 10 minutes automatically when connected
  - Manual sync available in portfolio section

### Request/Response Flow

All API requests use the **Circuit Breaker Pattern** for resilience:
- Threshold: 4 failures → Circuit opens for 120 seconds
- Automatic retry with exponential backoff
- Timeout protection: 10 seconds per request
- Error logging and user notifications

## Order Placement Example

### Paper Mode (Simulation)
Click "START" to use paper trading - orders execute instantly in simulation.

### Live Mode (Real Trading)
1. Toggle **Paper Mode OFF** in settings
2. Select an order type (Market/Limit)
3. Enter symbol, quantity, price
4. Click **Place Order**
5. Order executes via DHAN API
6. Confirmation telegram alert sent
7. Real-time P&L tracking enabled

## Data Persistence

### Auto-Backup
- All DHAN orders synced every 10 minutes
- Holdings automatically updated and backed up
- IndexedDB primary storage + localStorage fallback

### Configuration Storage
DHAN credentials stored securely:
- **Key**: `v4_dhan_auth`
- **Encrypted**: Uses localStorage + IndexedDB
- **Persistence**: Survives browser cache clear

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `DHAN not authenticated` | Credentials not provided | Check API Key/Secret in connection form |
| `DHAN timeout` | Network issue or API slow | Retry - auto-retry enabled (max 3 attempts) |
| `Invalid order parameters` | Symbol/qty/price validation failed | Validate symbol format (e.g., "SBIN") |
| `Order exceeds capital` | Position size too large | Reduce order size within risk limits |
| `Circuit breaker open` | 4+ API failures detected | Wait 120 seconds, system will retry |

### View Errors
All DHAN errors logged in **System Health Monitor → Logs**.

## API Response Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `success` / `ok` | Request successful | Proceed with response |
| `error` | API error | Check error message, retry |
| `pending` | Order pending | Monitor in order book |
| `filled` | Order executed | P&L tracking active |
| `cancelled` | Order cancelled | Released capital back |

## Rate Limits

DHAN API applies rate limiting (typically):
- **100 requests per minute** for standard accounts
- **1000 requests per minute** for premium accounts

AlgoDESK applies **Circuit Breaker** to respect these limits:
- Auto detects 429 (Too Many Requests)
- Backs off 120 seconds before retrying
- Prevents API hammering

## Supported Order Types

### Order Type
- **MARKET** - Execute at best available price
- **LIMIT** - Execute only at specified price

### Order Validity
- **GFD** (Good For Day) - Cancel at market close
- **GTD** (Good Till Date) - Multi-day validity (configured in DHAN app)

### Product Type
- **MIS** (Margin Intraday Scheme) - Intraday with leverage
- **CNC** (Cash and Carry) - Delivery, no leverage

### Exchange
- **NSE** (National Stock Exchange)
- **BSE** (Bombay Stock Exchange)

## API Documentation Reference

For complete DHAN API documentation:
- https://api.dhan.co/v2 (API Endpoint)
- https://docs.dhan.co/ (Official Documentation)
- https://support.dhan.co/ (Support Portal)

## Monitoring

### Health Checks
- Circuit Breaker status visible in System Health
- Connection status badge (top right corner)
- Real-time log updates in Logs section

### Metrics Tracked
- API call success/failure rates
- Circuit breaker state changes
- Order execution status
- Portfolio sync timestamps
- Error frequency and types

## Troubleshooting

### Portfolio Not Syncing?
1. Check "Status" in header shows "Dhan ●"
2. Verify DHAN credentials are correct
3. Check System Health logs for sync errors
4. Manual sync: Visit Portfolio section → Refresh

### Orders Not Executing?
1. Verify "Paper Mode" is OFF
2. Check available margin in Account Info
3. Confirm symbol is valid (search in Market Data)
4. Review error message in logs
5. Check circuit breaker status - if OPEN, wait 2 minutes

### Connection Issues?
1. Verify internet connection (8-second health check)
2. Check DHAN API status: https://status.dhan.co/
3. Confirm credentials haven't expired
4. Try disconnecting and reconnecting broker

## Advanced Features (Coming Soon)

- [ ] DHAN Websocket for real-time data
- [ ] Order OCO (One Cancels Other)
- [ ] Bracket orders with SL/TP
- [ ] Basket orders (multi-leg)
- [ ] Advanced P&L analytics
- [ ] Tax-loss harvesting suggestions

## Support & Reporting

For issues with DHAN integration:
1. Check logs in **System Health → Logs**
2. Review recent error messages
3. Verify DHAN API status page
4. Contact DHAN support with order/transaction details

## FAQs

**Q: Is my data safe with DHAN integration?**
A: Yes. Credentials stored locally in encrypted storage. No data sent to third parties except DHAN API.

**Q: Can I use paper & live mode together?**
A: Yes. Toggle "Paper Mode" to switch. Paper orders go to simulator. Live orders go to DHAN.

**Q: What happens if DHAN API goes down?**
A: Circuit breaker activates. System shows offline status. Paper trading continues. Auto-retries every 120 seconds.

**Q: How do I export DHAN order history?**
A: Go to **History → Trades**. Orders synced from DHAN show with broker badge. Export via browser DevTools.

**Q: Can I trade on multiple exchanges?**
A: Yes. NSE & BSE both supported. Select exchange when placing order.

## License & Terms

DHAN API integration follows DHAN's API Terms of Service:
- https://www.dhan.co/terms-api

---

**Last Updated**: March 2026  
**Version**: AlgoDESK v4.1  
**API Version**: DHAN v2
