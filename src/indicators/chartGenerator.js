/**
 * Chart Generator - Create charts with indicators for Telegram alerts
 */

const { createCanvas } = require('canvas');

class ChartGenerator {
  constructor(width = 800, height = 400) {
    this.width = width;
    this.height = height;
  }

  /**
   * Draw RSI indicator
   */
  drawRSIChart(candles, coin) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Calculate RSI
    const rsiPeriod = 14;
    const closes = candles.map(c => parseFloat(c.c));
    const rsiValues = this.calculateRSI(closes, rsiPeriod);

    // Draw RSI line
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const rsiHeight = this.height * 0.3;
    const rsiTop = this.height * 0.05;
    const startIdx = rsiValues.length > 100 ? rsiValues.length - 100 : 0;

    for (let i = startIdx; i < rsiValues.length; i++) {
      const x = ((i - startIdx) / (rsiValues.length - startIdx)) * this.width;
      const y = rsiTop + rsiHeight - (rsiValues[i] / 100) * rsiHeight;

      if (i === startIdx) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw overbought/oversold lines
    ctx.strokeStyle = '#ff4444';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, rsiTop + rsiHeight * 0.3); // 70
    ctx.lineTo(this.width, rsiTop + rsiHeight * 0.3);
    ctx.stroke();

    ctx.strokeStyle = '#44ff44';
    ctx.beginPath();
    ctx.moveTo(0, rsiTop + rsiHeight * 0.7); // 30
    ctx.lineTo(this.width, rsiTop + rsiHeight * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(`${coin}/USDT - RSI`, 10, 25);
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`RSI: ${rsiValues[rsiValues.length - 1]?.toFixed(1)}`, 10, this.height - 10);

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw candlestick chart with Bollinger Bands
   */
  drawCandleChart(candles, coin, indicator = 'BOLLINGER') {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    const candlesToDraw = candles.slice(-80);

    // Calculate Bollinger Bands
    const bb = this.calculateBollinger(candlesToDraw.map(c => parseFloat(c.c)), 20, 2);

    // Draw Bollinger Bands
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.beginPath();

    // Upper band fill
    for (let i = 0; i < bb.upper.length; i++) {
      const x = (i / bb.upper.length) * this.width;
      if (i === 0) ctx.moveTo(x, bb.upper[i]);
      else ctx.lineTo(x, bb.upper[i]);
    }

    // Lower band (reverse)
    for (let i = bb.lower.length - 1; i >= 0; i--) {
      const x = (i / bb.lower.length) * this.width;
      ctx.lineTo(x, bb.lower[i]);
    }
    ctx.closePath();
    ctx.fill();

    // Draw bands
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < bb.upper.length; i++) {
      const x = (i / bb.upper.length) * this.width;
      if (i === 0) ctx.moveTo(x, bb.upper[i]);
      else ctx.lineTo(x, bb.upper[i]);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < bb.lower.length; i++) {
      const x = (i / bb.lower.length) * this.width;
      if (i === 0) ctx.moveTo(x, bb.lower[i]);
      else ctx.lineTo(x, bb.lower[i]);
    }
    ctx.stroke();

    // Draw candles
    const candleWidth = this.width / candlesToDraw.length;
    const priceMin = Math.min(...candlesToDraw.map(c => parseFloat(c.l)));
    const priceMax = Math.max(...candlesToDraw.map(c => parseFloat(c.h)));
    const priceRange = priceMax - priceMin || 1;
    const chartHeight = this.height * 0.65;
    const chartTop = this.height * 0.35;

    for (let i = 0; i < candlesToDraw.length; i++) {
      const c = candlesToDraw[i];
      const open = parseFloat(c.o);
      const close = parseFloat(c.c);
      const high = parseFloat(c.h);
      const low = parseFloat(c.l);

      const x = i * candleWidth + candleWidth / 2;
      const isGreen = close >= open;
      const color = isGreen ? '#00ff88' : '#ff4444';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, chartTop + (priceMax - high) / priceRange * chartHeight);
      ctx.lineTo(x, chartTop + (priceMax - low) / priceRange * chartHeight);
      ctx.stroke();

      // Body
      const bodyTop = chartTop + (priceMax - Math.max(open, close)) / priceRange * chartHeight;
      const bodyBottom = chartTop + (priceMax - Math.min(open, close)) / priceRange * chartHeight;
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth * 0.35, bodyTop, candleWidth * 0.7, bodyHeight);
    }

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(`${coin}/USDT - ${indicator}`, 10, 25);

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw MACD chart
   */
  drawMACDChart(candles, coin) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    const closes = candles.map(c => parseFloat(c.c));
    const macdData = this.calculateMACD(closes);

    if (macdData.length === 0) return canvas.toBuffer('image/png');

    const chartHeight = this.height * 0.4;
    const chartTop = this.height * 0.3;
    const centerY = chartTop + chartHeight / 2;

    // Draw zero line
    ctx.strokeStyle = '#666666';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(this.width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Find range for scaling
    const allValues = macdData.flatMap(d => [d.macd, d.signal, d.histogram]);
    const maxVal = Math.max(...allValues.map(Math.abs)) || 1;

    // Draw histogram
    const barWidth = this.width / macdData.length;
    for (let i = 0; i < macdData.length; i++) {
      const d = macdData[i];
      const x = i * barWidth;
      const h = Math.abs(d.histogram) / maxVal * chartHeight / 2;
      const y = d.histogram >= 0 ? centerY - h : centerY;

      ctx.fillStyle = d.histogram >= 0 ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 68, 68, 0.5)';
      ctx.fillRect(x, y, barWidth - 1, h);
    }

    // Draw MACD line
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < macdData.length; i++) {
      const x = (i + 0.5) * barWidth;
      const y = centerY - (macdData[i].macd / maxVal) * chartHeight / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Signal line
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < macdData.length; i++) {
      const x = (i + 0.5) * barWidth;
      const y = centerY - (macdData[i].signal / maxVal) * chartHeight / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(`${coin}/USDT - MACD`, 10, 25);

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw Volume chart
   */
  drawVolumeChart(candles, coin) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    const volumes = candles.map(c => parseFloat(c.v));
    const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1) || 1;
    const maxVol = Math.max(...volumes) || 1;

    const volHeight = this.height * 0.3;
    const volTop = this.height * 0.65;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const v = parseFloat(c.v);
      const open = parseFloat(c.o);
      const close = parseFloat(c.c);
      const isGreen = close >= open;
      const barWidth = this.width / candles.length;

      const x = i * barWidth;
      const h = (v / maxVol) * volHeight;
      const y = volTop + volHeight - h;

      ctx.fillStyle = isGreen ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 68, 68, 0.6)';
      ctx.fillRect(x, y, barWidth - 1, h);

      // Spike indicator
      if (v > avgVolume * 3) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x, y - 3, barWidth - 1, 3);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(`${coin}/USDT - VOLUME`, 10, 25);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Current: ${(volumes[volumes.length - 1] / avgVolume).toFixed(1)}x avg`, 10, this.height - 10);

    return canvas.toBuffer('image/png');
  }

  calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return [];

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

  calculateBollinger(closes, period = 20, stdDev = 2) {
    const upper = [];
    const lower = [];
    const middle = [];

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.map(c => Math.pow(c - sma, 2)).reduce((a, b) => a + b, 0) / period;
      const std = Math.sqrt(variance);

      middle.push(sma);
      upper.push(sma + stdDev * std);
      lower.push(sma - stdDev * std);
    }

    return { upper, middle, lower };
  }

  calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
    if (closes.length < slow + signal) return [];

    const fastEMA = this.calculateEMA(closes, fast);
    const slowEMA = this.calculateEMA(closes, slow);

    const offset = fastEMA.length - slowEMA.length;
    const macdValues = [];

    for (let i = 0; i < slowEMA.length; i++) {
      if (offset + i >= 0 && offset + i < fastEMA.length) {
        macdValues.push(fastEMA[offset + i] - slowEMA[i]);
      }
    }

    if (macdValues.length < signal) return [];

    const signalValues = this.calculateEMA(macdValues, signal);

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

  calculateEMA(prices, period) {
    if (prices.length < period) return [];
    const multiplier = 2 / (period + 1);
    const ema = [prices.slice(0, period).reduce((a, b) => a + b, 0) / period];
    for (let i = period; i < prices.length; i++) {
      ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    return ema;
  }
}

module.exports = { ChartGenerator };