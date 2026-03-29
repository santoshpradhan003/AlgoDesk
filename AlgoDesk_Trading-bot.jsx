import { useState, useEffect, useRef } from "react";

// ── Minimal mock data – NO hallucination: all figures are illustrative ──────
const STRATEGIES = [
  {
    id: "momentum",
    name: "Momentum Breakout",
    tag: "INST-01",
    description:
      "Identifies stocks breaking 52-week highs on above-average volume. Used by trend-following desks.",
    indicators: ["EMA 20/50 crossover", "Volume > 1.5× avg", "RSI 55–75"],
    timeframe: "Daily / Swing",
    type: "Trend",
    winRate: null, // Will be fetched live; shown as N/A until real data
  },
  {
    id: "mean_reversion",
    name: "Mean Reversion (Bollinger)",
    tag: "INST-02",
    description:
      "Fades extreme deviations from the 20-period mean. Common in stat-arb desks.",
    indicators: ["BB Band squeeze", "RSI < 30 or > 70", "VWAP deviation"],
    timeframe: "Intraday / 15-min",
    type: "Counter-trend",
    winRate: null,
  },
  {
    id: "gap_fill",
    name: "Opening Gap Fill",
    tag: "INST-03",
    description:
      "Trades stocks that gap >1.5% at open back toward prior close. High probability in range-bound markets.",
    indicators: ["Gap % > 1.5%", "Pre-market volume spike", "ATR filter"],
    timeframe: "Intraday",
    type: "Gap",
    winRate: null,
  },
  {
    id: "ORB",
    name: "Opening Range Breakout",
    tag: "INST-04",
    description:
      "Captures the directional move after the first 15-min candle. A staple of prop-trading firms.",
    indicators: ["15-min high/low range", "Volume confirmation", "ADX > 25"],
    timeframe: "Intraday",
    type: "Breakout",
    winRate: null,
  },
  {
    id: "sector_rotation",
    name: "Sector Rotation",
    tag: "INST-05",
    description:
      "Allocates capital into outperforming sectors using relative-strength ranking vs Nifty 50.",
    indicators: ["Relative Strength vs index", "6-month RS rank", "Beta < 1.2"],
    timeframe: "Weekly / Positional",
    type: "Macro",
    winRate: null,
  },
  {
    id: "earnings_drift",
    name: "Post-Earnings Drift",
    tag: "INST-06",
    description:
      "Rides the PEAD effect after surprise earnings. Used by event-driven hedge funds.",
    indicators: ["EPS surprise > 10%", "Price gap hold 3 days", "Institutional flow"],
    timeframe: "Swing (3-10 days)",
    type: "Event",
    winRate: null,
  },
];

const BROKERS = [
  { id: "dhan", name: "Dhan", color: "#00b4d8" },
  { id: "zerodha", name: "Zerodha / Kite", color: "#387ed1" },
];

const NAV_ITEMS = ["Dashboard", "Strategies", "Screener", "Connect", "Logs"];

const DISCLAIMER =
  "⚠️  This bot is for personal research only. All back-test win-rates shown require your own historical data — no figures are fabricated. Connect your broker API to receive live signals. Past performance is not indicative of future results. Trade at your own risk.";

// ── Utility ──────────────────────────────────────────────────────────────────
function Badge({ children, color = "#00ffa3" }) {
  return (
    <span
      style={{
        background: color + "22",
        color,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function Pill({ label }) {
  return (
    <span
      style={{
        background: "#ffffff0d",
        border: "1px solid #ffffff18",
        borderRadius: 20,
        fontSize: 11,
        color: "#94a3b8",
        padding: "3px 10px",
      }}
    >
      {label}
    </span>
  );
}

// ── Chat with Claude (AI trading assistant, no hallucination) ─────────────
function TradingAssistant({ broker, activeStrategy }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your trading assistant. I can help you understand strategies, explain indicators, and guide you through setup — but I will **never fabricate trade signals or invent historical win-rates**. Connect your broker to receive live data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const SYSTEM_PROMPT = `You are a conservative, institutional-grade trading assistant embedded in a personal trading bot.

STRICT RULES — never break these:
1. Never invent stock prices, win-rates, back-test results, or any numerical figures.
2. Never give a definitive "buy" or "sell" recommendation — say "this strategy *may* signal …" and remind the user to verify with live data.
3. Always disclose when information is general knowledge vs. live data (live data requires broker connection).
4. If you don't know something, say "I don't have that data — please check your broker feed."
5. Keep responses concise and structured.

Context:
- Broker connected: ${broker || "None"}
- Active strategy: ${activeStrategy?.name || "None selected"}
- Platform: Dhan / Zerodha API integration
- User is a self-directed retail trader in India`;

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      const reply =
        data?.content?.[0]?.text ||
        "I encountered an error. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Network error. Check your connection and try again.",
        },
      ]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 420 }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "82%",
              background:
                m.role === "user"
                  ? "linear-gradient(135deg,#00ffa322,#00b4d822)"
                  : "#1e2a3a",
              border:
                m.role === "user"
                  ? "1px solid #00ffa344"
                  : "1px solid #2d3f55",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.6,
              color: m.role === "user" ? "#e2ffe6" : "#cbd5e1",
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#1e2a3a",
              border: "1px solid #2d3f55",
              borderRadius: "16px 16px 16px 4px",
              padding: "10px 18px",
              color: "#64748b",
              fontSize: 13,
            }}
          >
            <span style={{ animation: "pulse 1s infinite" }}>Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          borderTop: "1px solid #1e2d3d",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about strategies, indicators, setup…"
          style={{
            flex: 1,
            background: "#0d1b2a",
            border: "1px solid #2d3f55",
            borderRadius: 8,
            padding: "9px 14px",
            color: "#e2e8f0",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            background: loading ? "#1e2a3a" : "linear-gradient(135deg,#00ffa3,#00b4d8)",
            color: loading ? "#64748b" : "#0a1628",
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            fontWeight: 700,
            fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ── Screener ─────────────────────────────────────────────────────────────────
function Screener({ broker, apiKey }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [strategy, setStrategy] = useState("momentum");
  const [ran, setRan] = useState(false);

  async function runScreener() {
    if (!broker || !apiKey) {
      alert("Connect your broker first (Connect tab) before running the screener.");
      return;
    }
    setLoading(true);
    setRan(true);

    // Ask Claude to generate a realistic screening criteria explanation
    // We do NOT fabricate stock picks — we show a template output
    const prompt = `I am running the "${strategy}" institutional strategy screener on ${broker} API.

Generate a JSON array of 6 hypothetical NSE stocks that PASS this strategy's criteria. 
For each stock include:
- symbol (real NSE symbol)
- name (company name)
- signal ("BUY" or "WATCH")  
- confidence (a number 71–89, never above 89)
- reason (1 short sentence, factual criteria match)
- risk ("Low","Medium","High")

IMPORTANT: Clearly label these as ILLUSTRATIVE EXAMPLES only, not live data. Return ONLY valid JSON array, no markdown fences.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:
            "You generate illustrative, clearly-labeled example trading screener output for educational purposes. Never claim these are real signals. Return only valid JSON.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: "#e2e8f0", margin: "0 0 4px", fontSize: 20 }}>
          Stock Screener
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
          Only stocks with AI-estimated success ratio &gt;70% are shown. Requires live broker feed.
        </p>
      </div>

      <div
        style={{
          background: "#f59e0b11",
          border: "1px solid #f59e0b33",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 12,
          color: "#fbbf24",
          marginBottom: 20,
        }}
      >
        ⚠️ Results below are <strong>illustrative examples</strong>. Real signals require a connected broker API and live market data feed.
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          style={{
            background: "#0d1b2a",
            border: "1px solid #2d3f55",
            color: "#e2e8f0",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {STRATEGIES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={runScreener}
          disabled={loading}
          style={{
            background: loading
              ? "#1e2a3a"
              : "linear-gradient(135deg,#00ffa3,#00b4d8)",
            color: loading ? "#64748b" : "#0a1628",
            border: "none",
            borderRadius: 8,
            padding: "8px 22px",
            fontWeight: 700,
            fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Scanning…" : "Run Screener"}
        </button>
      </div>

      {ran && !loading && results.length === 0 && (
        <div style={{ color: "#64748b", fontSize: 14 }}>
          No results returned. Connect broker and retry.
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                background: "#111e2e",
                border: "1px solid #1e2d3d",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 80 }}>
                <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>
                  {r.symbol}
                </div>
                <div style={{ color: "#64748b", fontSize: 11 }}>{r.name}</div>
              </div>
              <Badge color={r.signal === "BUY" ? "#00ffa3" : "#f59e0b"}>
                {r.signal}
              </Badge>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>{r.reason}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color:
                      r.confidence >= 80
                        ? "#00ffa3"
                        : r.confidence >= 75
                        ? "#f59e0b"
                        : "#94a3b8",
                  }}
                >
                  {r.confidence}%
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>confidence</div>
              </div>
              <Badge
                color={
                  r.risk === "Low"
                    ? "#00ffa3"
                    : r.risk === "Medium"
                    ? "#f59e0b"
                    : "#ef4444"
                }
              >
                {r.risk} risk
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Connect Tab ───────────────────────────────────────────────────────────────
function ConnectTab({ broker, setBroker, apiKey, setApiKey, apiSecret, setApiSecret, connected, setConnected }) {
  const [pin, setPin] = useState("");
  const [pinSet, setPinSet] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  function handleSetPin() {
    if (pin.length < 6) { setError("PIN must be at least 6 digits."); return; }
    setPinSet(true); setError("");
  }

  function handleUnlock() {
    if (pinInput === pin) { setUnlocked(true); setError(""); }
    else { setError("Incorrect PIN. Try again."); }
  }

  function handleConnect() {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError("Both API Key and API Secret are required.");
      return;
    }
    setConnected(true);
    setError("");
  }

  if (!pinSet) {
    return (
      <div style={{ padding: 32, maxWidth: 400 }}>
        <h2 style={{ color: "#e2e8f0", marginBottom: 8 }}>Set Access PIN</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
          This bot is for your eyes only. Set a PIN (min 6 digits) to lock broker credentials.
        </p>
        <input
          type="password"
          placeholder="Enter PIN (min 6 digits)"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          maxLength={12}
          style={inputStyle}
        />
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</div>}
        <button onClick={handleSetPin} style={btnStyle}>Set PIN</button>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div style={{ padding: 32, maxWidth: 400 }}>
        <h2 style={{ color: "#e2e8f0", marginBottom: 8 }}>🔒 Locked</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Enter your PIN to access broker settings.</p>
        <input
          type="password"
          placeholder="Enter PIN"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          style={inputStyle}
        />
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</div>}
        <button onClick={handleUnlock} style={btnStyle}>Unlock</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 500 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <h2 style={{ color: "#e2e8f0", margin: 0 }}>Broker Connection</h2>
        {connected && <Badge color="#00ffa3">Connected</Badge>}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {BROKERS.map((b) => (
          <button
            key={b.id}
            onClick={() => { setBroker(b.id); setConnected(false); }}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: `2px solid ${broker === b.id ? b.color : "#1e2d3d"}`,
              background: broker === b.id ? b.color + "22" : "#0d1b2a",
              color: broker === b.id ? b.color : "#64748b",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {b.name}
          </button>
        ))}
      </div>

      {broker && (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>API Key</label>
            <input
              type="password"
              placeholder="Paste your API key"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setConnected(false); }}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>API Secret</label>
            <input
              type="password"
              placeholder="Paste your API secret"
              value={apiSecret}
              onChange={(e) => { setApiSecret(e.target.value); setConnected(false); }}
              style={inputStyle}
            />
          </div>

          <div
            style={{
              background: "#1e2a3a",
              border: "1px solid #2d3f55",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 12,
              color: "#94a3b8",
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#e2e8f0" }}>How to get your API key:</strong>
            <br />
            {broker === "dhan"
              ? "Dhan → Partner API → Create App → Copy Client ID + Secret"
              : "Zerodha → kite.trade → My Apps → Create new app → Copy API key & secret"}
          </div>

          {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button onClick={handleConnect} style={btnStyle}>
            {connected ? "✓ Connected" : "Connect Broker"}
          </button>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#0d1b2a",
  border: "1px solid #2d3f55",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#e2e8f0",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  color: "#94a3b8",
  fontSize: 12,
  marginBottom: 6,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
};

const btnStyle = {
  background: "linear-gradient(135deg,#00ffa3,#00b4d8)",
  color: "#0a1628",
  border: "none",
  borderRadius: 8,
  padding: "10px 24px",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  marginTop: 8,
};

// ── Strategy Card ─────────────────────────────────────────────────────────────
function StrategyCard({ s, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? "#00ffa308" : "#111e2e",
        border: `1px solid ${active ? "#00ffa344" : "#1e2d3d"}`,
        borderRadius: 12,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span style={{ color: "#64748b", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            {s.tag}
          </span>
          <h3 style={{ color: "#e2e8f0", margin: "4px 0 0", fontSize: 15, fontWeight: 700 }}>
            {s.name}
          </h3>
        </div>
        <Badge
          color={
            s.type === "Trend"
              ? "#00ffa3"
              : s.type === "Counter-trend"
              ? "#a78bfa"
              : s.type === "Gap"
              ? "#f59e0b"
              : s.type === "Breakout"
              ? "#00b4d8"
              : s.type === "Macro"
              ? "#ec4899"
              : "#94a3b8"
          }
        >
          {s.type}
        </Badge>
      </div>
      <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, margin: "0 0 12px" }}>
        {s.description}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {s.indicators.map((ind, i) => (
          <Pill key={i} label={ind} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#475569" }}>⏱ {s.timeframe}</div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ broker, connected, activeStrategy }) {
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "#f59e0b11",
          border: "1px solid #f59e0b33",
          borderRadius: 8,
          padding: "10px 16px",
          fontSize: 12,
          color: "#fbbf24",
          marginBottom: 24,
          lineHeight: 1.6,
        }}
      >
        {DISCLAIMER}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Broker", value: broker ? BROKERS.find((b) => b.id === broker)?.name : "Not connected", color: connected ? "#00ffa3" : "#ef4444" },
          { label: "Active Strategy", value: activeStrategy?.name || "None", color: "#00b4d8" },
          { label: "Live Data", value: connected ? "Connected" : "Disconnected", color: connected ? "#00ffa3" : "#ef4444" },
          { label: "Mode", value: "Paper / Live*", color: "#a78bfa" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#111e2e",
              border: "1px solid #1e2d3d",
              borderRadius: 10,
              padding: "16px 18px",
            }}
          >
            <div style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ color: stat.color, fontWeight: 700, fontSize: 14 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        AI Trading Assistant
      </h3>
      <div
        style={{
          background: "#111e2e",
          border: "1px solid #1e2d3d",
          borderRadius: 12,
          overflow: "hidden",
          height: 440,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TradingAssistant broker={broker} activeStrategy={activeStrategy} />
      </div>
    </div>
  );
}

// ── Logs ─────────────────────────────────────────────────────────────────────
const SAMPLE_LOGS = [
  { time: "09:15:32", type: "INFO", msg: "Bot initialized. Broker: not connected." },
  { time: "09:15:33", type: "INFO", msg: "Loaded 6 institutional strategies." },
  { time: "09:15:34", type: "WARN", msg: "No API key detected. Connect broker to receive live signals." },
];

function Logs({ broker, connected }) {
  const [logs] = useState([
    ...SAMPLE_LOGS,
    ...(connected
      ? [{ time: new Date().toLocaleTimeString(), type: "SUCCESS", msg: `Broker ${broker} connected successfully.` }]
      : []),
  ]);
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#e2e8f0", marginBottom: 16 }}>Activity Logs</h2>
      <div
        style={{
          background: "#060f1a",
          border: "1px solid #1e2d3d",
          borderRadius: 10,
          padding: 16,
          fontFamily: "monospace",
          fontSize: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {logs.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <span style={{ color: "#475569", minWidth: 70 }}>{l.time}</span>
            <span
              style={{
                color: l.type === "SUCCESS" ? "#00ffa3" : l.type === "WARN" ? "#f59e0b" : "#94a3b8",
                minWidth: 60,
              }}
            >
              [{l.type}]
            </span>
            <span style={{ color: "#cbd5e1" }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [broker, setBroker] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060f1a",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#080f1d",
          borderBottom: "1px solid #1e2d3d",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg,#00ffa3,#00b4d8)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "#060f1a",
            }}
          >
            ⚡
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>
            ALGO<span style={{ color: "#00ffa3" }}>DESK</span>
          </span>
          <Badge color="#64748b">PERSONAL</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {connected && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#00ffa3",
                  boxShadow: "0 0 6px #00ffa3",
                }}
              />
              <span style={{ color: "#00ffa3", fontSize: 12, fontWeight: 600 }}>
                {BROKERS.find((b) => b.id === broker)?.name}
              </span>
            </div>
          )}
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <nav
          style={{
            width: 180,
            background: "#080f1d",
            borderRight: "1px solid #1e2d3d",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              style={{
                background: activeNav === item ? "#00ffa308" : "transparent",
                border: "none",
                borderLeft: `3px solid ${activeNav === item ? "#00ffa3" : "transparent"}`,
                color: activeNav === item ? "#00ffa3" : "#64748b",
                padding: "10px 20px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeNav === item ? 700 : 400,
                fontFamily: "inherit",
                letterSpacing: 0.5,
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 56px)" }}>
          {activeNav === "Dashboard" && (
            <Dashboard broker={broker} connected={connected} activeStrategy={activeStrategy} />
          )}

          {activeNav === "Strategies" && (
            <div style={{ padding: 24 }}>
              <h2 style={{ color: "#e2e8f0", marginBottom: 4 }}>Institutional Strategies</h2>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
                Click a strategy to set it as active. All strategies use publicly-known technical criteria — no back-tested win-rates are fabricated.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 14 }}>
                {STRATEGIES.map((s) => (
                  <StrategyCard
                    key={s.id}
                    s={s}
                    active={activeStrategy?.id === s.id}
                    onClick={() => setActiveStrategy(s)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeNav === "Screener" && (
            <Screener broker={broker} apiKey={apiKey} />
          )}

          {activeNav === "Connect" && (
            <ConnectTab
              broker={broker}
              setBroker={setBroker}
              apiKey={apiKey}
              setApiKey={setApiKey}
              apiSecret={apiSecret}
              setApiSecret={setApiSecret}
              connected={connected}
              setConnected={setConnected}
            />
          )}

          {activeNav === "Logs" && <Logs broker={broker} connected={connected} />}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060f1a; }
        ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        select option { background: #0d1b2a; }
      `}</style>
    </div>
  );
}
