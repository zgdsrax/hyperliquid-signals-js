/**
 * ATR (Average True Range) Indicator
 * Signal: ATR_VOLATILITY_SPIKE
 */

class ATRCalculator {
  static calculateTrueRange(high, low, prevClose) {
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    return Math.max(tr1, tr2, tr3);
  }

  static calculate(candles, period = 14) {
    if (candles.length < period + 1) return [];

    const highs = candles.map(c => parseFloat(c.h));
    const lows = candles.map(c => parseFloat(c.l));
    const closes = candles.map(c => parseFloat(c.c));

    const trValues = [];
    for (let i = 1; i < candles.length; i++) {
      trValues.push(this.calculateTrueRange(highs[i], lows[i], closes[i - 1]));
    }

    // First ATR
    const firstATR = trValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const atrValues = [firstATR];

    // Subsequent ATR
    for (let i = period; i < trValues.length; i++) {
      atrValues.push((atrValues[atrValues.length - 1] * (period - 1) + trValues[i]) / period);
    }

    return atrValues;
  }

  static checkSignal(candles, coin, timeframe, period = 14, spikeThreshold = 2.0) {
    if (candles.length < period + 20) return null;

    const atrValues = this.calculate(candles, period);
    if (atrValues.length < 20) return null;

    const currentATR = atrValues[atrValues.length - 1];
    const smaATR = atrValues.slice(-20, -1).reduce((a, b) => a + b, 0) / 19;
    const atrRatio = smaATR > 0 ? currentATR / smaATR : 0;

    const price = parseFloat(candles[candles.length - 1].c);
    const candleTime = candles[candles.length - 1].t;

    if (atrRatio >= spikeThreshold) {
      const severity = atrRatio >= 3 ? 'EXTREME' : atrRatio >= 2.5 ? 'HIGH' : 'MEDIUM';
      return {
        indicator: 'ATR',
        coin,
        timeframe,
        signalType: 'ATR_VOLATILITY_SPIKE',
        value: atrRatio,
        price,
        candleTime,
        message: `ATR spike: ${atrRatio.toFixed(1)}x average (${currentATR.toFixed(4)} vs avg ${smaATR.toFixed(4)})`,
        severity
      };
    }

    return null;
  }
}

module.exports = { ATRCalculator };