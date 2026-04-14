/**
 * Price Change Indicator
 * Signal: PRICE_PUMP (>10%) or PRICE_DUMP (<-10%)
 */

class PriceChangeAnalyzer {
  static checkSignal(candles, coin, timeframe, pumpThreshold = 10.0, dumpThreshold = -10.0, lookback = 24) {
    if (candles.length < lookback + 1) return null;

    const currentPrice = parseFloat(candles[candles.length - 1].c);
    const previousPrice = parseFloat(candles[candles.length - lookback].c);
    const candleTime = candles[candles.length - 1].t;

    if (previousPrice === 0) return null;

    const changePct = ((currentPrice - previousPrice) / previousPrice) * 100;

    if (changePct >= pumpThreshold) {
      const severity = changePct >= 30 ? 'EXTREME' : changePct >= 20 ? 'HIGH' : 'MEDIUM';
      return {
        indicator: 'PRICE',
        coin,
        timeframe,
        signalType: 'PRICE_PUMP',
        value: changePct,
        price: currentPrice,
        candleTime,
        message: `Price pumped +${changePct.toFixed(1)}% in ${lookback}h ($${previousPrice.toFixed(2)} -> $${currentPrice.toFixed(2)})`,
        severity
      };
    }

    if (changePct <= dumpThreshold) {
      const severity = changePct <= -30 ? 'EXTREME' : changePct <= -20 ? 'HIGH' : 'MEDIUM';
      return {
        indicator: 'PRICE',
        coin,
        timeframe,
        signalType: 'PRICE_DUMP',
        value: changePct,
        price: currentPrice,
        candleTime,
        message: `Price dumped ${changePct.toFixed(1)}% in ${lookback}h ($${previousPrice.toFixed(2)} -> $${currentPrice.toFixed(2)})`,
        severity
      };
    }

    return null;
  }
}

module.exports = { PriceChangeAnalyzer };