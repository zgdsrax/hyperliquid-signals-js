/**
 * Chart Generator - Create charts with indicators for Telegram alerts
 * Enhanced with larger size and more data
 */

const { createCanvas } = require('canvas');

class ChartGenerator {
  constructor(width = 1600, height = 800) {
    this.width = width;
    this.height = height;
  }

  /**
   * Draw RSI indicator with data
   */
  drawRSIChart(candles, coin, timeframe = '15m') {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Calculate RSI
    const rsiPeriod = 14;
    const closes = candles.map(c => parseFloat(c.c));
    const rsiValues = this.calculateRSI(closes, rsiPeriod);

    if (rsiValues.length === 0) return canvas.toBuffer('image/png');

    const latestRSI = rsiValues[rsiValues.length - 1];
    const prevRSI = rsiValues[rsiValues.length - 2] || latestRSI;

    // Title with coin, timeframe and RSI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${coin}/USDT - RSI (${rsiPeriod}) ${timeframe}`, 30, 50);

    // RSI value box
    const rsiColor = latestRSI > 70 ? '#ff4444' : latestRSI < 30 ? '#44ff44' : '#ffd700';
    ctx.fillStyle = rsiColor;
    ctx.fillRect(this.width - 250, 20, 220, 70);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`RSI: ${latestRSI.toFixed(1)}`, this.width - 230, 65);

    // Change indicator
    const rsiChange = latestRSI - prevRSI;
    ctx.fillStyle = rsiChange >= 0 ? '#00ff88' : '#ff4444';
    ctx.font = '24px Arial';
    ctx.fillText(`${rsiChange >= 0 ? '▲' : '▼'} ${Math.abs(rsiChange).toFixed(1)}`, this.width - 230, 85);

    // Data range for chart
    const rsiStartIdx = rsiValues.length > 50 ? rsiValues.length - 50 : 0;

    // RSI chart area with axes
    const chartLeft = 120;
    const chartRight = this.width - 80;
    const chartTop = 120;
    const chartBottom = this.height - 150;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;

    // === Y-Axis (RSI Scale 0-100) ===
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;

    // Y-axis line
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    for (let i = 0; i <= 10; i++) {
      const y = chartTop + (chartHeight / 10) * i;
      const rsiVal = 100 - i * 10;

      // Grid line
      ctx.strokeStyle = '#333333';
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#666666';
      ctx.fillText(`${rsiVal}`, 5, y + 5);
    }

    // === X-Axis ===
    ctx.strokeStyle = '#444444';
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    // X-axis labels (period index)
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    for (let i = 0; i <= 5; i++) {
      const x = chartLeft + (chartWidth / 5) * i;
      const idx = Math.floor(rsiStartIdx + ((rsiValues.length - rsiStartIdx) / 5) * i);
      ctx.fillText(`${idx}`, x - 10, chartBottom + 20);
    }

    // Draw zones
    // Overbought zone (>70)
    ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
    ctx.fillRect(chartLeft, chartTop, chartWidth, chartHeight * 0.3);

    // Oversold zone (<30)
    ctx.fillStyle = 'rgba(68, 255, 68, 0.2)';
    ctx.fillRect(chartLeft, chartTop + chartHeight * 0.7, chartWidth, chartHeight * 0.3);

    // Neutral zone (40-60) - subtle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(chartLeft, chartTop + chartHeight * 0.4, chartWidth, chartHeight * 0.2);

    // Draw RSI line
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const startIdx = rsiValues.length > 50 ? rsiValues.length - 50 : 0;

    for (let i = rsiStartIdx; i < rsiValues.length; i++) {
      const x = chartLeft + ((i - rsiStartIdx) / (rsiValues.length - rsiStartIdx - 1)) * chartWidth;
      const y = chartTop + chartHeight - (rsiValues[i] / 100) * chartHeight;

      if (i === startIdx) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw horizontal lines
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // 70 line (overbought)
    const y70 = chartTop + chartHeight * 0.3;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y70);
    ctx.lineTo(chartRight, y70);
    ctx.stroke();
    ctx.fillStyle = '#ff4444';
    ctx.font = '20px Arial';
    ctx.fillText('70 (Overbought)', chartRight - 160, y70 - 5);

    // 30 line (oversold)
    const y30 = chartTop + chartHeight * 0.7;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y30);
    ctx.lineTo(chartRight, y30);
    ctx.stroke();
    ctx.fillStyle = '#44ff44';
    ctx.fillText('30 (Oversold)', chartRight - 150, y30 + 25);

    // 50 line (neutral)
    ctx.strokeStyle = '#444444';
    const y50 = chartTop + chartHeight * 0.5;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y50);
    ctx.lineTo(chartRight, y50);
    ctx.stroke();

    ctx.setLineDash([]);

    // Current RSI dot
    const lastX = chartRight;
    const lastY = chartTop + chartHeight - (latestRSI / 100) * chartHeight;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
    ctx.fillStyle = rsiColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Footer info
    ctx.fillStyle = '#888888';
    ctx.font = '22px Arial';
    ctx.fillText(`Data: ${candles.length} candles | Period: ${rsiPeriod}`, 30, this.height - 30);
    ctx.fillText(`Signal: ${latestRSI > 70 ? 'OVERBOUGHT' : latestRSI < 30 ? 'OVERSOLD' : 'NEUTRAL'}`, chartRight - 250, this.height - 30);

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw candlestick chart with Bollinger Bands and data
   */
  drawCandleChart(candles, coin, timeframe = '15m', indicator = 'BOLLINGER') {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Get data - HALF the candles for larger view
    const candlesToDraw = candles.slice(-30); // 30 candles instead of 60
    const prices = candlesToDraw.map(c => parseFloat(c.c));
    const highs = candlesToDraw.map(c => parseFloat(c.h));
    const lows = candlesToDraw.map(c => parseFloat(c.l));

    const latestPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2] || latestPrice;
    const priceChange = latestPrice - prevPrice;
    const priceChangePct = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;
    const priceColor = priceChange >= 0 ? '#00ff88' : '#ff4444';

    const priceMin = Math.min(...lows) * 0.999;
    const priceMax = Math.max(...highs) * 1.001;
    const priceRange = priceMax - priceMin || 1;

    // Calculate Bollinger Bands
    const bb = this.calculateBollinger(prices, 20, 2);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${coin}/USDT - ${indicator} ${timeframe}`, 30, 50);

    // Price box
    ctx.fillStyle = priceColor;
    ctx.fillRect(this.width - 350, 15, 330, 80);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`$${latestPrice.toFixed(4)}`, this.width - 330, 60);
    ctx.font = '24px Arial';
    ctx.fillText(`${priceChange >= 0 ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(4)} (${priceChangePct.toFixed(2)}%)`, this.width - 330, 85);

    // Candle area with axes
    const chartLeft = 120;
    const chartRight = this.width - 180;
    const chartTop = 120;
    const chartBottom = this.height - 120;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;
    const candleWidth = chartWidth / candlesToDraw.length;

    // === Y-Axis (Price Scale) ===
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Y-axis line
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.stroke();

    // Y-axis labels and grid lines
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    const ySteps = 8;
    for (let i = 0; i <= ySteps; i++) {
      const y = chartTop + (chartHeight / ySteps) * i;
      const price = priceMax - (priceRange / ySteps) * i;

      // Grid line
      ctx.strokeStyle = '#333333';
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#888888';
      ctx.fillText(`$${price.toFixed(2)}`, 5, y + 5);
    }

    // === X-Axis (Candle/Time Scale) ===
    ctx.strokeStyle = '#444444';
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    // X-axis labels (show every 5th candle)
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    for (let i = 0; i < candlesToDraw.length; i += 5) {
      const x = chartLeft + i * candleWidth + candleWidth / 2;
      ctx.fillText(`${i + 1}`, x, chartBottom + 20);
    }
    // Last candle label
    ctx.fillText(`${candlesToDraw.length}`, chartRight, chartBottom + 20);

    // Draw Bollinger Bands
    if (bb.upper.length > 0) {
      const bbOffset = prices.length - bb.upper.length;

      // Band fill
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.beginPath();
      for (let i = 0; i < bb.upper.length; i++) {
        const x = chartLeft + ((i + bbOffset) / (prices.length - 1)) * chartWidth;
        const y = chartTop + chartHeight - ((bb.upper[i] - priceMin) / priceRange) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = bb.lower.length - 1; i >= 0; i--) {
        const x = chartLeft + ((i + bbOffset) / (prices.length - 1)) * chartWidth;
        const y = chartTop + chartHeight - ((bb.lower[i] - priceMin) / priceRange) * chartHeight;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Upper band
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < bb.upper.length; i++) {
        const x = chartLeft + ((i + bbOffset) / (prices.length - 1)) * chartWidth;
        const y = chartTop + chartHeight - ((bb.upper[i] - priceMin) / priceRange) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Middle band
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.beginPath();
      for (let i = 0; i < bb.middle.length; i++) {
        const x = chartLeft + ((i + bbOffset) / (prices.length - 1)) * chartWidth;
        const y = chartTop + chartHeight - ((bb.middle[i] - priceMin) / priceRange) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lower band
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.beginPath();
      for (let i = 0; i < bb.lower.length; i++) {
        const x = chartLeft + ((i + bbOffset) / (prices.length - 1)) * chartWidth;
        const y = chartTop + chartHeight - ((bb.lower[i] - priceMin) / priceRange) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw candles
    for (let i = 0; i < candlesToDraw.length; i++) {
      const c = candlesToDraw[i];
      const open = parseFloat(c.o);
      const close = parseFloat(c.c);
      const high = parseFloat(c.h);
      const low = parseFloat(c.l);

      const x = chartLeft + i * candleWidth + candleWidth / 2;
      const isGreen = close >= open;
      const color = isGreen ? '#00ff88' : '#ff4444';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const wickTop = chartTop + chartHeight - ((high - priceMin) / priceRange) * chartHeight;
      const wickBottom = chartTop + chartHeight - ((low - priceMin) / priceRange) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(x, wickTop);
      ctx.lineTo(x, wickBottom);
      ctx.stroke();

      // Body
      const bodyTop = chartTop + chartHeight - ((Math.max(open, close) - priceMin) / priceRange) * chartHeight;
      const bodyBottom = chartTop + chartHeight - ((Math.min(open, close) - priceMin) / priceRange) * chartHeight;
      const bodyHeight = Math.max(2, bodyBottom - bodyTop);

      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth * 0.35, bodyTop, candleWidth * 0.7, bodyHeight);
    }

    // Price scale (right side)
    ctx.fillStyle = '#666666';
    ctx.font = '18px Arial';
    for (let i = 0; i <= 5; i++) {
      const y = chartTop + (chartHeight / 5) * i;
      const price = priceMax - (priceRange / 5) * i;
      ctx.fillText(`$${price.toFixed(2)}`, chartRight + 10, y + 5);
      ctx.strokeStyle = '#333333';
      ctx.beginPath();
      ctx.moveTo(chartRight, y);
      ctx.lineTo(chartRight + 5, y);
      ctx.stroke();
    }

    // BB values
    if (bb.upper.length > 0) {
      const lastBB = {
        upper: bb.upper[bb.upper.length - 1],
        middle: bb.middle[bb.middle.length - 1],
        lower: bb.lower[bb.lower.length - 1]
      };
      ctx.fillStyle = '#ffd700';
      ctx.font = '20px Arial';
      ctx.fillText(`Upper: $${lastBB.upper.toFixed(4)}`, 30, this.height - 100);
      ctx.fillText(`Middle: $${lastBB.middle.toFixed(4)}`, 30, this.height - 75);
      ctx.fillText(`Lower: $${lastBB.lower.toFixed(4)}`, 30, this.height - 50);
    }

    // Footer
    ctx.fillStyle = '#888888';
    ctx.font = '22px Arial';
    ctx.fillText(`Data: ${candles.length} candles | Range: $${priceMin.toFixed(2)} - $${priceMax.toFixed(2)}`, 30, this.height - 25);

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw MACD chart with data
   */
  drawMACDChart(candles, coin, timeframe = '15m') {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    const closes = candles.map(c => parseFloat(c.c));
    const macdData = this.calculateMACD(closes);

    if (macdData.length === 0) return canvas.toBuffer('image/png');

    const latest = macdData[macdData.length - 1];
    const prev = macdData[macdData.length - 2] || latest;

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${coin}/USDT - MACD (12, 26, 9) ${timeframe}`, 30, 50);

    // MACD value box
    const macdColor = latest.histogram >= 0 ? '#00ff88' : '#ff4444';
    ctx.fillStyle = macdColor;
    ctx.fillRect(this.width - 300, 15, 280, 80);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`MACD: ${latest.macd.toFixed(5)}`, this.width - 280, 50);
    ctx.font = '20px Arial';
    ctx.fillText(`Signal: ${latest.signal.toFixed(5)}`, this.width - 280, 75);

    // Chart area with axes
    const chartLeft = 120;
    const chartRight = this.width - 100;
    const chartTop = 120;
    const chartBottom = this.height - 150;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;

    // Find range for scaling (MUST be before axis labels)
    const allValues = macdData.flatMap(d => [d.macd, d.signal, d.histogram]);
    const maxVal = Math.max(...allValues.map(Math.abs)) || 1;
    const centerY = chartTop + chartHeight / 2;

    // === Y-Axis ===
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText(`+${maxVal.toFixed(4)}`, 5, chartTop + 10);
    ctx.fillText('0', 5, centerY + 5);
    ctx.fillText(`-${maxVal.toFixed(4)}`, 5, chartBottom);

    // === X-Axis ===
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    // X-axis labels
    ctx.font = '14px Arial';
    for (let i = 0; i <= 4; i++) {
      const x = chartLeft + (chartWidth / 4) * i;
      const period = Math.floor((macdData.length / 4) * i);
      ctx.fillText(`${period}`, x - 10, chartBottom + 20);
    }

    // Draw zero line
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(chartLeft, centerY);
    ctx.lineTo(chartRight, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Positive histogram zone
    ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.fillRect(chartLeft, chartTop, chartWidth, chartHeight / 2);

    // Negative histogram zone
    ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';
    ctx.fillRect(chartLeft, centerY, chartWidth, chartHeight / 2);

    // Draw histogram
    const barWidth = chartWidth / macdData.length;
    for (let i = 0; i < macdData.length; i++) {
      const d = macdData[i];
      const x = chartLeft + i * barWidth;
      const h = Math.abs(d.histogram) / maxVal * chartHeight / 2;
      const y = d.histogram >= 0 ? centerY - h : centerY;

      ctx.fillStyle = d.histogram >= 0 ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 68, 68, 0.6)';
      ctx.fillRect(x + 1, y, barWidth - 2, h);
    }

    // Draw MACD line
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < macdData.length; i++) {
      const x = chartLeft + (i + 0.5) * barWidth;
      const y = centerY - (macdData[i].macd / maxVal) * chartHeight / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Signal line
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < macdData.length; i++) {
      const x = chartLeft + (i + 0.5) * barWidth;
      const y = centerY - (macdData[i].signal / maxVal) * chartHeight / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Current dot
    ctx.beginPath();
    ctx.arc(chartRight, centerY - (latest.macd / maxVal) * chartHeight / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00aaff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(chartRight, centerY - (latest.signal / maxVal) * chartHeight / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fill();

    // Legend
    ctx.fillStyle = '#00aaff';
    ctx.font = '22px Arial';
    ctx.fillText('─ MACD Line', chartRight - 180, this.height - 120);
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('─ Signal Line', chartRight - 180, this.height - 95);

    // Footer
    ctx.fillStyle = '#888888';
    ctx.font = '22px Arial';
    ctx.fillText(`Data: ${macdData.length} periods | Histogram: ${latest.histogram.toFixed(5)} | Signal: ${latest.signal >= 0 ? 'BULLISH' : 'BEARISH'}`, 30, this.height - 30);

    return canvas.toBuffer('image/png');
  }

  /**
   * Draw Volume chart with data
   */
  drawVolumeChart(candles, coin, timeframe = '15m') {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    const volumes = candles.map(c => parseFloat(c.v));
    const closes = candles.map(c => parseFloat(c.c));
    const latestVol = volumes[volumes.length - 1];
    const avgVol = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1) || 1;
    const volRatio = latestVol / avgVol;

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${coin}/USDT - VOLUME ${timeframe}`, 30, 50);

    // Volume box
    const volColor = volRatio > 3 ? '#ff4444' : volRatio < 0.5 ? '#ffd700' : '#00ff88';
    ctx.fillStyle = volColor;
    ctx.fillRect(this.width - 350, 15, 330, 80);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${volRatio.toFixed(2)}x AVG`, this.width - 330, 50);
    ctx.font = '22px Arial';
    ctx.fillText(`Current: ${this.formatNumber(latestVol)}`, this.width - 330, 78);

    // Volume bars
    const maxVol = Math.max(...volumes) || 1;
    const volHeight = this.height * 0.5;
    const volTop = this.height * 0.35;
    const chartLeft = 120;
    const chartRight = this.width - 100;
    const chartWidth = chartRight - chartLeft;
    const barWidth = chartWidth / candles.length;

    // === Y-Axis (Volume) ===
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, volTop);
    ctx.lineTo(chartLeft, volTop + volHeight);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText(this.formatNumber(maxVol), 5, volTop + 15);
    ctx.fillText(this.formatNumber(maxVol / 2), 5, volTop + volHeight / 2 + 5);
    ctx.fillText(this.formatNumber(avgVol), 5, volTop + volHeight - 5);

    // === X-Axis ===
    ctx.beginPath();
    ctx.moveTo(chartLeft, volTop + volHeight);
    ctx.lineTo(chartRight, volTop + volHeight);
    ctx.stroke();

    // X-axis labels
    ctx.font = '14px Arial';
    for (let i = 0; i <= 4; i++) {
      const x = chartLeft + (chartWidth / 4) * i;
      const idx = Math.floor((candles.length / 4) * i);
      ctx.fillText(`${idx}`, x - 10, volTop + volHeight + 20);
    }

    // Average line
    const avgY = volTop + volHeight - (avgVol / maxVol) * volHeight;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(chartLeft, avgY);
    ctx.lineTo(chartRight, avgY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd700';
    ctx.font = '18px Arial';
    ctx.fillText(`AVG: ${this.formatNumber(avgVol)}`, chartRight - 150, avgY - 5);

    // Spike zones
    const spikeZone = avgY - 20;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const v = parseFloat(c.v);
      const open = parseFloat(c.o);
      const close = parseFloat(c.c);
      const isGreen = close >= open;
      const x = chartLeft + i * barWidth;
      const h = (v / maxVol) * volHeight;
      const y = volTop + volHeight - h;

      // Bar color
      if (v > avgVol * 5) {
        ctx.fillStyle = '#ff0000'; // Extreme spike
      } else if (v > avgVol * 3) {
        ctx.fillStyle = '#ff6600'; // High spike
      } else if (v > avgVol * 2) {
        ctx.fillStyle = '#ffaa00'; // Medium spike
      } else {
        ctx.fillStyle = isGreen ? 'rgba(0, 255, 136, 0.7)' : 'rgba(255, 68, 68, 0.7)';
      }
      ctx.fillRect(x + 1, y, barWidth - 2, h);

      // Spike indicator
      if (v > avgVol * 3) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 1, y - 5, barWidth - 2, 5);
      }
    }

    // Legend
    ctx.fillStyle = '#ff0000';
    ctx.font = '18px Arial';
    ctx.fillText('■ Extreme (>5x)', chartRight - 180, this.height - 130);
    ctx.fillStyle = '#ff6600';
    ctx.fillText('■ High (>3x)', chartRight - 180, this.height - 108);
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('■ Medium (>2x)', chartRight - 180, this.height - 86);

    // Footer
    ctx.fillStyle = '#888888';
    ctx.font = '22px Arial';
    ctx.fillText(`Data: ${candles.length} periods | Max: ${this.formatNumber(maxVol)} | Min: ${this.formatNumber(Math.min(...volumes))}`, 30, this.height - 30);

    return canvas.toBuffer('image/png');
  }

  formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
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