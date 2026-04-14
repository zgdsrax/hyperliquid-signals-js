/**
 * Hyperliquid Signals Bot (Node.js)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import modules
const { HyperliquidClient } = require('./api/hyperliquid');
const { RSICalculator } = require('./indicators/rsi');
const { VolumeAnalyzer } = require('./indicators/volume');
const { MACDCalculator } = require('./indicators/macd');
const { MACalculator } = require('./indicators/ma_cross');
const { BollingerCalculator } = require('./indicators/bollinger');
const { ATRCalculator } = require('./indicators/atr');
const { PriceChangeAnalyzer } = require('./indicators/price_change');
const { SignalManager } = require('./signals/signalManager');

class HyperliquidSignalsBot {
  constructor() {
    this.client = new HyperliquidClient();
    this.signalManager = new SignalManager();
    this.config = this.loadConfig();
    this.alertConfig = this.loadAlertConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, '..', 'config', 'settings.yaml');
      const yaml = require('js-yaml');
      return yaml.load(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.log('Config error:', e.message);
      return {};
    }
  }

  loadAlertConfig() {
    try {
      const configPath = path.join(__dirname, '..', 'config', 'alert_channels.yaml');
      const yaml = require('js-yaml');
      return yaml.load(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  async getCoins() {
    const configCoins = this.config?.monitoring?.coins || [];
    if (configCoins.length > 0) {
      return configCoins;
    }

    const meta = await this.client.getMeta();
    const active = meta.filter(c => !c.isDelisted).map(c => c.name);
    return active.slice(0, 30); // Top 30 coins
  }

  async runIndicator(coin, timeframe, indicatorName) {
    try {
      const candles = await this.client.getCandles(coin, timeframe, 200);
      if (!candles || candles.length < 10) return null;

      switch (indicatorName) {
        case 'RSI':
          return RSICalculator.checkSignal(candles, coin, timeframe);
        case 'VOLUME':
          return VolumeAnalyzer.checkSignal(candles, coin, timeframe);
        case 'MACD':
          return MACDCalculator.checkSignal(candles, coin, timeframe);
        case 'MA_CROSS':
          return MACalculator.checkSignal(candles, coin, timeframe);
        case 'BOLLINGER':
          return BollingerCalculator.checkSignal(candles, coin, timeframe);
        case 'ATR':
          return ATRCalculator.checkSignal(candles, coin, timeframe);
        case 'PRICE':
          return PriceChangeAnalyzer.checkSignal(candles, coin, timeframe);
        default:
          return null;
      }
    } catch (error) {
      console.error(`  ${indicatorName} error: ${error.message}`);
      return null;
    }
  }

  async scanAll(coins, timeframe = '1h') {
    const indicators = ['RSI', 'VOLUME', 'MACD', 'MA_CROSS', 'BOLLINGER', 'ATR', 'PRICE'];
    const signals = [];

    console.log(`\n📊 Scanning ${coins.length} coins with ${indicators.length} indicators...`);

    for (const coin of coins) {
      process.stdout.write(`  ${coin}... `);

      for (const indicator of indicators) {
        const signal = await this.runIndicator(coin, timeframe, indicator);
        if (signal) {
          signals.push(signal);
        }
      }

      console.log('✓');

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return signals;
  }

  async sendTelegramAlert(signal) {
    const token = this.alertConfig?.telegram?.bot_token;
    const chatId = this.alertConfig?.telegram?.chat_id;

    if (!token || !chatId) return;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const message = this.signalManager.formatTelegramMessage(signal);

    try {
      await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }, { timeout: 10000 });
    } catch (error) {
      console.error(`Telegram error: ${error.message}`);
    }
  }

  async runScan() {
    console.log('\n' + '='.repeat(60));
    console.log(`🔍 SCAN STARTED: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

    const coins = await this.getCoins();
    console.log(`Monitoring ${coins.length} coins`);

    // Run all indicators
    const signals = await this.scanAll(coins);

    console.log(`\n📈 Found ${signals.length} signals`);

    // Process signals
    for (const signal of signals) {
      const emoji = signal.signalType.includes('BEARISH') || 
                    signal.signalType.includes('OVERBOUGHT') || 
                    signal.signalType.includes('DUMP') ? '🔴' : '🟢';
      
      console.log(`  ${emoji} [${signal.indicator}] ${signal.coin}: ${signal.signalType} (${signal.severity})`);

      // Send to Telegram
      await this.sendTelegramAlert(signal);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return signals;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const once = args.includes('--once');
  const intervalArg = args.find(a => a.startsWith('--interval='));
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1]) : 15;
  const coinsArg = args.find(a => a.startsWith('--coins='));
  
  const bot = new HyperliquidSignalsBot();
  
  if (coinsArg) {
    const coins = coinsArg.split('=')[1].split(',');
    bot.coinsOverride = coins;
    console.log(`Monitoring: ${coins.join(', ')}`);
  }

  if (once) {
    await bot.runScan();
  } else {
    console.log(`\n🚀 Bot running - scanning every ${interval} minutes`);
    console.log('Press Ctrl+C to stop\n');

    await bot.runScan();

    // Schedule next scan
    setInterval(async () => {
      await bot.runScan();
    }, interval * 60 * 1000);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HyperliquidSignalsBot };