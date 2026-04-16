/**
 * FVG (Fair Value Gap) Indicator
 * Detects imbalance zones where price moved too fast
 * Signal: FVG_BULLISH (gap up), FVG_BEARISH (gap down)
 */

class FVGCalculator {
  /**
   * Check for Fair Value Gap
   * FVG = 3 candles where middle candle's range doesn't overlap with 1st and 3rd
   */
  static checkSignal(candles, coin, timeframe) {
    if (candles.length < 3) return null;

    // Need enough candles for analysis
    const c1 = candles[candles.length - 3];
    const c2 = candles[candles.length - 2];
    const c3 = candles[candles.length - 1];

    const open1 = parseFloat(c1.o);
    const high1 = parseFloat(c1.h);
    const low1 = parseFloat(c1.l);
    const close1 = parseFloat(c1.c);

    const open2 = parseFloat(c2.o);
    const high2 = parseFloat(c2.h);
    const low2 = parseFloat(c2.l);

    const open3 = parseFloat(c3.o);
    const high3 = parseFloat(c3.h);
    const low3 = parseFloat(c3.l);
    const close3 = parseFloat(c3.c);

    // Bullish FVG: Gap up between candle 1 and 3
    // Candle 2's low is higher than candle 1's high (gap up)
    const bullishFVG = low2 > high1;
    const bullishGapSize = ((low2 - high1) / high1) * 100;

    // Bearish FVG: Gap down between candle 1 and 3
    // Candle 2's high is lower than candle 1's low (gap down)
    const bearishFVG = high2 < low1;
    const bearishGapSize = ((low1 - high2) / low1) * 100;

    const price = close3;
    const candleTime = c3.t;

    // Bullish FVG signal
    if (bullishFVG && bullishGapSize > 0.1) {
      const severity = bullishGapSize > 1 ? 'HIGH' : bullishGapSize > 0.5 ? 'MEDIUM' : 'LOW';
      return {
        indicator: 'FVG',
        coin,
        timeframe,
        signalType: 'FVG_BULLISH',
        value: bullishGapSize,
        price,
        candleTime,
        message: `Fair Value Gap UP +${bullishGapSize.toFixed(2)}% (Gap: $${low2.toFixed(2)} > $${high1.toFixed(2)})`,
        severity
      };
    }

    // Bearish FVG signal
    if (bearishFVG && bearishGapSize > 0.1) {
      const severity = bearishGapSize > 1 ? 'HIGH' : bearishGapSize > 0.5 ? 'MEDIUM' : 'LOW';
      return {
        indicator: 'FVG',
        coin,
        timeframe,
        signalType: 'FVG_BEARISH',
        value: bearishGapSize,
        price,
        candleTime,
        message: `Fair Value Gap DOWN -${bearishGapSize.toFixed(2)}% (Gap: $${high2.toFixed(2)} < $${low1.toFixed(2)})`,
        severity
      };
    }

    return null;
  }

  /**
   * Find all FVGs in recent candles
   */
  static findAllFVGs(candles, minGapPct = 0.1) {
    const fvgs = [];

    for (let i = 2; i < candles.length; i++) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1];
      const c3 = candles[i];

      const high1 = parseFloat(c1.h);
      const low1 = parseFloat(c1.l);
      const low2 = parseFloat(c2.l);
      const high2 = parseFloat(c2.h);

      const bullishFVG = low2 > high1;
      const bearishFVG = high2 < low1;

      if (bullishFVG) {
        const gapSize = ((low2 - high1) / high1) * 100;
        if (gapSize >= minGapPct) {
          fvgs.push({
            type: 'BULLISH',
            gapSize,
            top: low2,
            bottom: high1,
            candleIndex: i
          });
        }
      }

      if (bearishFVG) {
        const gapSize = ((low1 - high2) / low1) * 100;
        if (gapSize >= minGapPct) {
          fvgs.push({
            type: 'BEARISH',
            gapSize,
            top: low1,
            bottom: high2,
            candleIndex: i
          });
        }
      }
    }

    return fvgs;
  }
}

module.exports = { FVGCalculator };
