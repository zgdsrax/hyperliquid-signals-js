/**
 * Bollinger Bands Indicator
 * Signal: BB_UPPER_BREAK or BB_LOWER_BREAK
 */

class BollingerCalculator {
  static calculate(candles, period = 20, stdDev = 2.0) {
    if (candles.length < period) return null;

    const closes = candles.map(c => parseFloat(c.c));
    const recent = closes.slice(-period);

    const sma = recent.reduce((a, b) => a + b, 0) / period;
    const variance = recent.map(c => Math.pow(c - sma, 2)).reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * std),
      middle: sma,
      lower: sma - (stdDev * std),
      std
    };
  }

  static checkSignal(candles, coin, timeframe, period = 20, stdDev = 2.0) {
    if (candles.length < period + 1) return null;

    const bb = this.calculate(candles, period, stdDev);
    if (!bb) return null;

    const price = parseFloat(candles[candles.length - 1].c);
    const candleTime = candles[candles.length - 1].t;

    // Upper band break
    if (price > bb.upper) {
      const position = 100 + ((price - bb.upper) / bb.upper) * 100;
      return {
        indicator: 'BOLLINGER',
        coin,
        timeframe,
        signalType: 'BB_UPPER_BREAK',
        value: position,
        price,
        candleTime,
        message: `Price $${price.toFixed(2)} broke above upper band $${bb.upper.toFixed(2)}`,
        severity: 'HIGH'
      };
    }

    // Lower band break
    if (price < bb.lower) {
      const position = -100 + ((price - bb.lower) / bb.lower) * 100;
      return {
        indicator: 'BOLLINGER',
        coin,
        timeframe,
        signalType: 'BB_LOWER_BREAK',
        value: position,
        price,
        candleTime,
        message: `Price $${price.toFixed(2)} broke below lower band $${bb.lower.toFixed(2)}`,
        severity: 'HIGH'
      };
    }

    return null;
  }
}

module.exports = { BollingerCalculator };