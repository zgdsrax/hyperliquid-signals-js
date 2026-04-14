/**
 * Volume Indicator
 * Signal: VOLUME_SPIKE (current > 3x avg) or VOLUME_DUMP (current < 0.3x avg)
 */

class VolumeAnalyzer {
  static calculateAvgVolume(candles, lookback = 20) {
    if (candles.length < lookback) {
      lookback = candles.length;
    }
    if (lookback === 0) return 0;

    const totalVolume = candles.slice(-lookback, -1)
      .reduce((sum, c) => sum + parseFloat(c.v), 0);
    return totalVolume / lookback;
  }

  static checkSignal(candles, coin, timeframe, spikeThreshold = 3.0, dumpThreshold = 0.3, lookback = 20) {
    if (candles.length < lookback + 1) return null;

    const currentVolume = parseFloat(candles[candles.length - 1].v);
    const avgVolume = this.calculateAvgVolume(candles, lookback);
    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 0;

    const price = parseFloat(candles[candles.length - 1].c);
    const candleTime = candles[candles.length - 1].t;

    if (volumeRatio >= spikeThreshold) {
      const severity = volumeRatio >= 5 ? 'EXTREME' : volumeRatio >= 4 ? 'HIGH' : volumeRatio >= 3 ? 'MEDIUM' : 'LOW';
      return {
        indicator: 'VOLUME',
        coin,
        timeframe,
        signalType: 'VOLUME_SPIKE',
        value: volumeRatio,
        price,
        candleTime,
        message: `Volume ${volumeRatio.toFixed(1)}x average (${currentVolume.toFixed(0)} vs avg ${avgVolume.toFixed(0)})`,
        severity
      };
    }

    if (volumeRatio <= dumpThreshold) {
      const severity = volumeRatio <= 0.1 ? 'EXTREME' : volumeRatio <= 0.2 ? 'HIGH' : volumeRatio <= 0.3 ? 'MEDIUM' : 'LOW';
      return {
        indicator: 'VOLUME',
        coin,
        timeframe,
        signalType: 'VOLUME_DUMP',
        value: volumeRatio,
        price,
        candleTime,
        message: `Volume ${volumeRatio.toFixed(1)}x average (${currentVolume.toFixed(0)} vs avg ${avgVolume.toFixed(0)})`,
        severity
      };
    }

    return null;
  }
}

module.exports = { VolumeAnalyzer };