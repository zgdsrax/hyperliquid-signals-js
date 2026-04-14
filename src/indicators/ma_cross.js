/**
 * MA Cross Indicator
 * Signal: MA_BULLISH or MA_BEARISH
 */

class MACalculator {
  static calculateSMA(prices, period) {
    if (prices.length < period) return [];
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      sma.push(prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
    }
    return sma;
  }

  static checkSignal(candles, coin, timeframe, fastPeriods = [9, 20], slowPeriods = [50, 200]) {
    if (candles.length < Math.max(...slowPeriods) + 2) return null;

    const closes = candles.map(c => parseFloat(c.c));
    const price = closes[closes.length - 1];
    const candleTime = candles[candles.length - 1].t;

    for (const fast of fastPeriods) {
      for (const slow of slowPeriods) {
        if (closes.length < slow + 2) continue;

        const fastMA = this.calculateSMA(closes, fast);
        const slowMA = this.calculateSMA(closes, slow);

        if (fastMA.length < 2 || slowMA.length < 2) continue;

        const offset = fastMA.length - slowMA.length;
        if (offset < 0) continue;

        const prevFast = fastMA[fastMA.length - 2];
        const prevSlow = slowMA[slowMA.length - 1];
        const currFast = fastMA[fastMA.length - 1];
        const currSlow = slowMA[slowMA.length - 1];

        // Bullish: fast crosses above slow
        if (prevFast <= prevSlow && currFast > currSlow) {
          const spread = (currFast - currSlow) / currSlow * 100;
          const severity = spread > 1 ? 'HIGH' : 'MEDIUM';
          return {
            indicator: 'MA_CROSS',
            coin,
            timeframe,
            signalType: 'MA_BULLISH',
            value: currFast - currSlow,
            price,
            candleTime,
            message: `MA${fast} crossed above MA${slow} (MA${fast}: ${currFast.toFixed(2)}, MA${slow}: ${currSlow.toFixed(2)})`,
            severity
          };
        }

        // Bearish: fast crosses below slow
        if (prevFast >= prevSlow && currFast < currSlow) {
          const spread = (currSlow - currFast) / currSlow * 100;
          const severity = spread > 1 ? 'HIGH' : 'MEDIUM';
          return {
            indicator: 'MA_CROSS',
            coin,
            timeframe,
            signalType: 'MA_BEARISH',
            value: currFast - currSlow,
            price,
            candleTime,
            message: `MA${fast} crossed below MA${slow} (MA${fast}: ${currFast.toFixed(2)}, MA${slow}: ${currSlow.toFixed(2)})`,
            severity
          };
        }
      }
    }

    return null;
  }
}

module.exports = { MACalculator };