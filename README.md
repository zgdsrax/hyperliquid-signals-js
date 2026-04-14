# Hyperliquid Signals (Node.js)

Monitor Hyperliquid perpetual markets và generate **independent signals** cho từng indicator. Mỗi indicator tạo signal riêng, không cộng chung.

## 📊 Indicators (Independent Signals)

| Indicator | Signal Types |
|-----------|-------------|
| **RSI** | `RSI_OVERBOUGHT` (>70), `RSI_OVERSOLD` (<30) |
| **Volume** | `VOLUME_SPIKE` (>3x avg), `VOLUME_DUMP` (<0.3x avg) |
| **MACD** | `MACD_BULLISH_CROSS`, `MACD_BEARISH_CROSS` |
| **MA Cross** | `MA_BULLISH`, `MA_BEARISH` (MA9/20 vs MA50/200) |
| **Bollinger** | `BB_UPPER_BREAK`, `BB_LOWER_BREAK` |
| **ATR** | `ATR_VOLATILITY_SPIKE` (>2x average) |
| **Price Change** | `PRICE_PUMP` (>10%), `PRICE_DUMP` (<-10%) |

## 🚀 Usage

```bash
# Install
npm install

# Run once
npm run once

# Run with specific coins
node src/bot.js --coins BTC,ETH,SOL

# Run continuously (every 15 min)
npm start

# Run with custom interval
node src/bot.js --interval 30
```

## 📁 Project Structure

```
hyperliquid-signals/
├── config/
│   ├── settings.yaml         # Bot settings
│   └── alert_channels.yaml   # Telegram/Discord
├── src/
│   ├── api/
│   │   └── hyperliquid.js     # Hyperliquid API client
│   ├── indicators/
│   │   ├── rsi.js
│   │   ├── volume.js
│   │   ├── macd.js
│   │   ├── ma_cross.js
│   │   ├── bollinger.js
│   │   ├── atr.js
│   │   └── price_change.js
│   ├── signals/
│   │   └── signalManager.js
│   └── bot.js                # Main entry
├── package.json
└── README.md
```

## ⚠️ Disclaimer

Research tool, không phải financial advice.