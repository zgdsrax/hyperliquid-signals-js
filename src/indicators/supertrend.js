/**
 * SuperTrend Indicator
 * Trend following indicator combining ATR with middle band
 * Signal: SUPERTREND_BULLISH (buy) / SUPERTREND_BEARISH (sell)
 */

class SuperTrendCalculator {
  static calculate(candles, period = 10, multiplier = 3) {
    if (candles.length < period + 1) return [];

    const highs = candles.map(c => parseFloat(c.h));
    const lows = candles.map(c => parseFloat(c.l));
    const closes = candles.map(c => parseFloat(c.c));

    // Calculate ATR
    const atrValues = this.calculateATR(candles, period);

    // Calculate SuperTrend
    const results = [];
    let upperBand = 0;
    let lowerBand = 0;
    let superTrend = 0;
    let trend = 1; // 1 = bullish, -1 = bearish

    for (let i = period; i < closes.length; i++) {
      const atr = atrValues[i - period];
      const hl2 = (highs[i] + lows[i]) / 2;

      // Calculate bands
      upperBand = hl2 + (multiplier * atr);
      lowerBand = hl2 - (multiplier * atr);

      // Get previous values
      const prevClose = closes[i - 1];
      const prevUpper = results.length > 0 ? results[results.length - 1].upperBand : upperBand;
      const prevLower = results.length > 0 ? results[results.length - 1].lowerBand : lowerBand;
      const prevSuperTrend = results.length > 0 ? results[results.length - 1].superTrend : closes[i - 1];
      const prevTrend = results.length > 0 ? results[results.length - 1].trend : 1;

      // Calculate SuperTrend
      if (i === period) {
        superTrend = hl2;
        trend = 1;
      } else {
        // Bearish trend
        if (prevClose > prevUpper) {
          trend = 1;
        } else if (prevClose < prevLower) {
          trend = -1;
        } else {
          trend = prevTrend;
        }

        if (trend === 1) {
          superTrend = Math.max(lowerBand, prevSuperTrend);
        } else {
          superTrend = Math.min(upperBand, prevSuperTrend);
        }
      }

      results.push({
        upperBand,
        lowerBand,
        superTrend,
        trend,
        close: closes[i],
        atr
      });
    }

    return results;
  }

  static calculateATR(candles, period = 10) {
    if (candles.length < period + 1) return [];

    const highs = candles.map(c => parseFloat(c.h));
    const lows = candles.map(c => parseFloat(c.l));
    const closes = candles.map(c => parseFloat(c.c));

    const trValues = [];
    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trValues.push(tr);
    }

    // First ATR
    const atr = [trValues.slice(0, period).reduce((a, b) => a + b, 0) / period];

    // Subsequent ATR values
    for (let i = period; i < trValues.length; i++) {
      atr.push((atr[atr.length - 1] * (period - 1) + trValues[i]) / period);
    }

    return atr;
  }

  static checkSignal(candles, coin, timeframe, period = 10, multiplier = 3) {
    if (candles.length < period + 5) return null;

    const data = this.calculate(candles, period, multiplier);
    if (data.length < 2) return null;

    const prev = data[data.length - 2];
    const current = data[data.length - 1];

    const price = parseFloat(candles[candles.length - 1].c);
    const prevPrice = parseFloat(candles[candles.length - 2].c);
    const candleTime = candles[candles.length - 1].t;

    // Check for trend change (crossover)
    if (prev.trend === -1 && current.trend === 1) {
      // Bearish to Bullish
      return {
        indicator: 'SUPERTREND',
        coin,
        timeframe,
        signalType: 'SUPERTREND_BULLISH',
        value: current.superTrend,
        price,
        candleTime,
        message: `SuperTrend crossed above price - BULLISH TREND (ST: $${current.superTrend.toFixed(4)}, Price: $${price.toFixed(4)})`,
        severity: 'HIGH'
      };
    }

    if (prev.trend === 1 && current.trend === -1) {
      // Bullish to Bearish
      return {
        indicator: 'SUPERTREND',
        coin,
        timeframe,
        signalType: 'SUPERTREND_BEARISH',
        value: current.superTrend,
        price,
        candleTime,
        message: `SuperTrend crossed below price - BEARISH TREND (ST: $${current.superTrend.toFixed(4)}, Price: $${price.toFixed(4)})`,
        severity: 'HIGH'
      };
    }

    // Check for price break from SuperTrend (price crosses ST line)
    const stDistance = ((price - current.superTrend) / current.superTrend) * 100;
    const prevStDistance = ((prevPrice - prev.superTrend) / prev.superTrend) * 100;

    // If price crosses above ST while in bearish, or below ST while in bullish
    if (prevPrice <= prev.superTrend && price > current.superTrend && current.trend === 1) {
      return {
        indicator: 'SUPERTREND',
        coin,
        timeframe,
        signalType: 'SUPERTREND_BULLISH',
        value: current.superTrend,
        price,
        candleTime,
        message: `Price broke above SuperTrend - BULLISH (ST: $${current.superTrend.toFixed(4)}, Price: $${price.toFixed(4)}, +${stDistance.toFixed(2)}%)`,
        severity: 'MEDIUM'
      };
    }

    if (prevPrice >= prev.superTrend && price < current.superTrend && current.trend === -1) {
      return {
        indicator: 'SUPERTREND',
        coin,
        timeframe,
        signalType: 'SUPERTREND_BEARISH',
        value: current.superTrend,
        price,
        candleTime,
        message: `Price broke below SuperTrend - BEARISH (ST: $${current.superTrend.toFixed(4)}, Price: $${price.toFixed(4)}, ${stDistance.toFixed(2)}%)`,
        severity: 'MEDIUM'
      };
    }

    return null;
  }
}

module.exports = { SuperTrendCalculator };
