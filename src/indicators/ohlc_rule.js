/**
 * OHLC Rule Indicator - Smart Money Concept (SMC)
 * Golden Rule: Buy below Open, Sell above Open
 * This detects when price is in discount (below open) or premium (above open) zone
 */

class OHLCRuleCalculator {
  /**
   * Check OHLC position vs Open price
   * Bullish: Price is below Open (Discount zone)
   * Bearish: Price is above Open (Premium zone)
   */
  static checkSignal(candles, coin, timeframe) {
    if (candles.length < 2) return null;

    const currentCandle = candles[candles.length - 1];
    const currentOpen = parseFloat(currentCandle.o);
    const currentClose = parseFloat(currentCandle.c);
    const currentHigh = parseFloat(currentCandle.h);
    const currentLow = parseFloat(currentCandle.l);
    const currentPrice = currentClose;

    const candleTime = currentCandle.t;

    // Calculate how far price has moved from open
    const distanceFromOpen = ((currentClose - currentOpen) / currentOpen) * 100;

    // Also check previous candle for context
    const prevCandle = candles[candles.length - 2];
    const prevOpen = parseFloat(prevCandle.o);
    const prevClose = parseFloat(prevCandle.c);
    const prevHigh = parseFloat(prevCandle.h);
    const prevLow = parseFloat(prevCandle.l);

    // Check for discount/premium zones
    // Price significantly BELOW open = Discount = Buy zone
    if (distanceFromOpen < -0.5) { // More than 0.5% below open
      const discountSeverity = distanceFromOpen < -2 ? 'HIGH' : distanceFromOpen < -1 ? 'MEDIUM' : 'LOW';

      // Check for rejection from lows (potential reversal)
      const touchedLow = currentLow < prevLow;
      const closingNearHigh = currentClose > (currentHigh + currentLow) / 2;

      if (closingNearHigh || touchedLow) {
        return {
          indicator: 'OHLC_RULE',
          coin,
          timeframe,
          signalType: 'OHLC_DISCOUNT_BUY',
          value: distanceFromOpen,
          price: currentPrice,
          candleTime,
          message: `DISCOUNT ZONE 🟢 Price ${distanceFromOpen.toFixed(2)}% below Open - Potential BUY area${closingNearHigh ? ' (Rejection from low)' : ''}`,
          severity: discountSeverity
        };
      }
    }

    // Price significantly ABOVE open = Premium = Sell zone
    if (distanceFromOpen > 0.5) { // More than 0.5% above open
      const premiumSeverity = distanceFromOpen > 2 ? 'HIGH' : distanceFromOpen > 1 ? 'MEDIUM' : 'LOW';

      // Check for rejection from highs (potential reversal)
      const touchedHigh = currentHigh > prevHigh;
      const closingNearLow = currentClose < (currentHigh + currentLow) / 2;

      if (closingNearLow || touchedHigh) {
        return {
          indicator: 'OHLC_RULE',
          coin,
          timeframe,
          signalType: 'OHLC_PREMIUM_SELL',
          value: distanceFromOpen,
          price: currentPrice,
          candleTime,
          message: `PREMIUM ZONE 🔴 Price ${distanceFromOpen.toFixed(2)}% above Open - Potential SELL area${closingNearLow ? ' (Rejection from high)' : ''}`,
          severity: premiumSeverity
        };
      }
    }

    // Check for strong candle closing far from open (momentum)
    if (Math.abs(distanceFromOpen) > 1.5) {
      if (distanceFromOpen > 0) {
        return {
          indicator: 'OHLC_RULE',
          coin,
          timeframe,
          signalType: 'OHLC_STRONG_BULL',
          value: distanceFromOpen,
          price: currentPrice,
          candleTime,
          message: `STRONG BULL ${distanceFromOpen.toFixed(2)}% above Open - Momentum confirmation`,
          severity: 'MEDIUM'
        };
      } else {
        return {
          indicator: 'OHLC_RULE',
          coin,
          timeframe,
          signalType: 'OHLC_STRONG_BEAR',
          value: distanceFromOpen,
          price: currentPrice,
          candleTime,
          message: `STRONG BEAR ${distanceFromOpen.toFixed(2)}% below Open - Momentum confirmation`,
          severity: 'MEDIUM'
        };
      }
    }

    return null;
  }

  /**
   * Get OHLC statistics for current candle
   */
  static getStats(candles) {
    if (candles.length < 2) return null;

    const current = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    const currOpen = parseFloat(current.o);
    const currClose = parseFloat(current.c);
    const currHigh = parseFloat(current.h);
    const currLow = parseFloat(current.l);

    const prevOpen = parseFloat(prev.o);
    const prevClose = parseFloat(prev.c);

    return {
      current: {
        open: currOpen,
        close: currClose,
        high: currHigh,
        low: currLow,
        change: ((currClose - currOpen) / currOpen) * 100
      },
      prev: {
        open: prevOpen,
        close: prevClose,
        change: ((prevClose - prevOpen) / prevOpen) * 100
      },
      zone: currClose < currOpen ? 'DISCOUNT' : 'PREMIUM'
    };
  }
}

module.exports = { OHLCRuleCalculator };
