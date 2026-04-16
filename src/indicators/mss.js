/**
 * MSS (Market Structure Shift) Indicator
 * Detects when market structure breaks - trend change confirmation
 * Signal: MSS_BULLISH (higher low breaks higher high), MSS_BEARISH (lower high breaks lower low)
 */

class MSSCalculator {
  /**
   * Detect Market Structure Shift
   * Bullish MSS: Price breaks above previous swing high
   * Bearish MSS: Price breaks below previous swing low
   */
  static checkSignal(candles, coin, timeframe) {
    if (candles.length < 20) return null;

    // Find swing highs and lows
    const swingData = this.findSwingPoints(candles, 5);

    if (swingData.swingHighs.length < 2 || swingData.swingLows.length < 2) {
      return null;
    }

    const currentPrice = parseFloat(candles[candles.length - 1].c);
    const candleTime = candles[candles.length - 1].t;

    // Get last 2 swing highs and lows
    const lastHighs = swingData.swingHighs.slice(-3);
    const lastLows = swingData.swingLows.slice(-3);

    // MSS Bullish: Last low is higher than previous low, and price breaks above last high
    if (this.lastLowChange(lastLows) && currentPrice > lastHighs[lastHighs.length - 1]) {
      const prevLow = lastLows[lastLows.length - 2];
      const currLow = lastLows[lastLows.length - 1];
      const change = ((currLow - prevLow) / prevLow) * 100;

      return {
        indicator: 'MSS',
        coin,
        timeframe,
        signalType: 'MSS_BULLISH',
        value: change,
        price: currentPrice,
        candleTime,
        message: `Market Structure Shift BULLISH - Higher Low confirmed, broke above ${lastHighs[lastHighs.length - 1].toFixed(4)}`,
        severity: 'HIGH'
      };
    }

    // MSS Bearish: Last high is lower than previous high, and price breaks below last low
    if (this.lastHighChange(lastHighs) && currentPrice < lastLows[lastLows.length - 1]) {
      const prevHigh = lastHighs[lastHighs.length - 2];
      const currHigh = lastHighs[lastHighs.length - 1];
      const change = ((prevHigh - currHigh) / prevHigh) * 100;

      return {
        indicator: 'MSS',
        coin,
        timeframe,
        signalType: 'MSS_BEARISH',
        value: change,
        price: currentPrice,
        candleTime,
        message: `Market Structure Shift BEARISH - Lower High confirmed, broke below ${lastLows[lastLows.length - 1].toFixed(4)}`,
        severity: 'HIGH'
      };
    }

    return null;
  }

  static findSwingPoints(candles, period = 5) {
    const swingHighs = [];
    const swingLows = [];

    for (let i = period; i < candles.length - period; i++) {
      const currentHigh = parseFloat(candles[i].h);
      const currentLow = parseFloat(candles[i].l);

      let isSwingHigh = true;
      let isSwingLow = true;

      // Check if it's a swing high
      for (let j = i - period; j <= i + period; j++) {
        if (j === i) continue;
        if (parseFloat(candles[j].h) >= currentHigh) {
          isSwingHigh = false;
        }
      }

      // Check if it's a swing low
      for (let j = i - period; j <= i + period; j++) {
        if (j === i) continue;
        if (parseFloat(candles[j].l) <= currentLow) {
          isSwingLow = false;
        }
      }

      if (isSwingHigh) {
        swingHighs.push(currentHigh);
      }
      if (isSwingLow) {
        swingLows.push(currentLow);
      }
    }

    return { swingHighs, swingLows };
  }

  /**
   * Check if recent swing lows are making higher lows
   */
  static lastLowChange(swingLows) {
    if (swingLows.length < 2) return false;
    const last = swingLows[swingLows.length - 1];
    const prev = swingLows[swingLows.length - 2];
    return last > prev;
  }

  /**
   * Check if recent swing highs are making lower highs
   */
  static lastHighChange(swingHighs) {
    if (swingHighs.length < 2) return false;
    const last = swingHighs[swingHighs.length - 1];
    const prev = swingHighs[swingHighs.length - 2];
    return last < prev;
  }
}

module.exports = { MSSCalculator };
