/**
 * MACD Indicator
 * Signal: MACD_BULLISH_CROSS or MACD_BEARISH_CROSS
 */

class MACDCalculator {
  static calculateEMA(prices, period) {
    if (prices.length < period) return [];
    const multiplier = 2 / (period + 1);
    const ema = [prices.slice(0, period).reduce((a, b) => a + b, 0) / period];
    for (let i = period; i < prices.length; i++) {
      ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    return ema;
  }

  static calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (candles.length < slowPeriod + signalPeriod) return [];

    const closes = candles.map(c => parseFloat(c.c));
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);

    // MACD = Fast EMA - Slow EMA
    const macdValues = [];
    const offset = fastEMA.length - slowEMA.length;
    for (let i = 0; i < slowEMA.length; i++) {
      if (offset + i >= 0 && offset + i < fastEMA.length) {
        macdValues.push(fastEMA[offset + i] - slowEMA[i]);
      }
    }

    if (macdValues.length < signalPeriod) return [];

    // Signal line = EMA of MACD
    const signalValues = this.calculateEMA(macdValues, signalPeriod);

    // Histogram = MACD - Signal
    const result = [];
    for (let i = 0; i < signalValues.length; i++) {
      const macdIdx = i + (macdValues.length - signalValues.length);
      if (macdIdx >= 0 && macdIdx < macdValues.length) {
        result.push({
          macd: macdValues[macdIdx],
          signal: signalValues[i],
          histogram: macdValues[macdIdx] - signalValues[i]
        });
      }
    }

    return result;
  }

  static checkSignal(candles, coin, timeframe) {
    const macdData = this.calculateMACD(candles);
    if (macdData.length < 3) return null;

    const prev2 = macdData[macdData.length - 3];
    const prev1 = macdData[macdData.length - 2];
    const current = macdData[macdData.length - 1];

    const price = parseFloat(candles[candles.length - 1].c);
    const candleTime = candles[candles.length - 1].t;

    // Bullish crossover: MACD crosses above signal
    if (prev1.macd >= prev1.signal && current.macd > current.signal) {
      const severity = Math.abs(current.histogram) > Math.abs(prev1.histogram) * 1.5 ? 'HIGH' : 'MEDIUM';
      return {
        indicator: 'MACD',
        coin,
        timeframe,
        signalType: 'MACD_BULLISH_CROSS',
        value: current.histogram,
        price,
        candleTime,
        message: `MACD crossed above signal (MACD: ${current.macd.toFixed(4)}, Signal: ${current.signal.toFixed(4)})`,
        severity
      };
    }

    // Bearish crossover: MACD crosses below signal
    if (prev1.macd <= prev1.signal && current.macd < current.signal) {
      const severity = Math.abs(current.histogram) > Math.abs(prev1.histogram) * 1.5 ? 'HIGH' : 'MEDIUM';
      return {
        indicator: 'MACD',
        coin,
        timeframe,
        signalType: 'MACD_BEARISH_CROSS',
        value: current.histogram,
        price,
        candleTime,
        message: `MACD crossed below signal (MACD: ${current.macd.toFixed(4)}, Signal: ${current.signal.toFixed(4)})`,
        severity
      };
    }

    return null;
  }
}

module.exports = { MACDCalculator };