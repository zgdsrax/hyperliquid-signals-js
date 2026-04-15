/**
 * Signal Manager - Quản lý signals độc lập
 */

class SignalManager {
  constructor() {
    this.signals = [];
    this.alertCooldown = {};
    this.cooldownSeconds = 300; // 5 minutes
  }

  addSignal(signal) {
    const key = `${signal.coin}:${signal.indicator}`;
    const lastAlert = this.alertCooldown[key] || 0;

    if (Date.now() / 1000 - lastAlert < this.cooldownSeconds) {
      console.log(`Cooldown: skipping ${signal.coin} ${signal.indicator}`);
      return;
    }

    this.signals.push(signal);
    this.alertCooldown[key] = Date.now() / 1000;
  }

  addSignals(signals) {
    signals.forEach(s => this.addSignal(s));
  }

  getSignalsByIndicator(indicator) {
    return this.signals.filter(s => s.indicator === indicator);
  }

  getSignalsByCoin(coin) {
    return this.signals.filter(s => s.coin === coin);
  }

  getHighSeveritySignals() {
    return this.signals.filter(s => s.severity === 'HIGH' || s.severity === 'EXTREME');
  }

  clearSignals() {
    this.signals = [];
  }

  formatTelegramMessage(signal) {
    const emojiMap = {
      'RSI_OVERBOUGHT': '🔴',
      'RSI_OVERSOLD': '🟢',
      'VOLUME_SPIKE': '📈',
      'VOLUME_DUMP': '📉',
      'MACD_BULLISH_CROSS': '🟢',
      'MACD_BEARISH_CROSS': '🔴',
      'MA_BULLISH': '🟢',
      'MA_BEARISH': '🔴',
      'BB_UPPER_BREAK': '📈',
      'BB_LOWER_BREAK': '📉',
      'ATR_VOLATILITY_SPIKE': '⚡',
      'PRICE_PUMP': '🚀',
      'PRICE_DUMP': '📉',
      'SUPERTREND_BULLISH': '🟢',
      'SUPERTREND_BEARISH': '🔴'
    };

    const emoji = emojiMap[signal.signalType] || '📊';
    const time = new Date(signal.candleTime).toLocaleString();

    return `${emoji} <b>${signal.indicator} SIGNAL</b>

<b>Coin:</b> ${signal.coin}
<b>Timeframe:</b> ${signal.timeframe}
<b>Signal:</b> ${signal.signalType}
<b>Value:</b> ${signal.value.toFixed(4)}
<b>Price:</b> $${signal.price.toFixed(4)}
<b>Severity:</b> ${signal.severity}
<b>Message:</b> ${signal.message}

⏰ ${time}`;
  }
}

module.exports = { SignalManager };