/**
 * RSI (Relative Strength Index) Indicator
 * Signal: RSI_OVERBOUGHT (RSI > 70) or RSI_OVERSOLD (RSI < 30)
 */

class RSICalculator {
  static calculate(candles, period = 14) {
    if (candles.length < period + 1) return [];

    const closes = candles.map(c => parseFloat(c.c));

    const gains = [];
    const losses = [];

    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(Math.max(change, 0));
      losses.push(Math.max(-change, 0));
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    const rsiValues = [];

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      if (avgLoss === 0) {
        rsiValues.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
      }
    }

    return rsiValues;
  }

  static getLatestRSI(candles, period = 14) {
    const rsiValues = this.calculate(candles, period);
    return rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;
  }

  static checkSignal(candles, coin, timeframe, period = 14, overboughtThreshold = 70, oversoldThreshold = 30) {
    const rsiValues = this.calculate(candles, period);
    if (rsiValues.length === 0) return null;

    const rsi = rsiValues[rsiValues.length - 1];
    const price = parseFloat(candles[candles.length - 1].c);
    const candleTime = candles[candles.length - 1].t;

    let signalType, severity, message;

    if (rsi >= overboughtThreshold) {
      signalType = 'RSI_OVERBOUGHT';
      severity = rsi >= 90 ? 'EXTREME' : rsi >= 80 ? 'HIGH' : 'MEDIUM';
      message = `RSI at ${rsi.toFixed(1)} - Overbought zone`;
    } else if (rsi <= oversoldThreshold) {
      signalType = 'RSI_OVERSOLD';
      severity = rsi <= 10 ? 'EXTREME' : rsi <= 20 ? 'HIGH' : 'MEDIUM';
      message = `RSI at ${rsi.toFixed(1)} - Oversold zone`;
    } else {
      return null;
    }

    return {
      indicator: 'RSI',
      coin,
      timeframe,
      signalType,
      value: rsi,
      price,
      candleTime,
      message,
      severity
    };
  }
}

module.exports = { RSICalculator };