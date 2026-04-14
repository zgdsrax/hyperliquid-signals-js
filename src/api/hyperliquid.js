/**
 * Hyperliquid API Client
 */

const axios = require('axios');

class HyperliquidClient {
  constructor() {
    this.baseUrl = 'https://api.hyperliquid.xyz/info';
  }

  async _post(payload) {
    try {
      const response = await axios.post(this.baseUrl, payload, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error(`Hyperliquid API error: ${error.message}`);
      return null;
    }
  }

  async getMeta() {
    const data = await this._post({ type: 'meta' });
    if (data && data.universe) {
      return data.universe;
    }
    return [];
  }

  async getAllMids() {
    const data = await this._post({ type: 'allMids' });
    if (data) {
      const mids = {};
      for (const [key, value] of Object.entries(data)) {
        mids[key] = parseFloat(value);
      }
      return mids;
    }
    return {};
  }

  async getCandles(coin, interval = '1h', limit = 200) {
    const endTimeMs = Date.now();
    const intervalMs = {
      '1m': 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    }[interval] || 60 * 60 * 1000;

    const startTimeMs = endTimeMs - limit * intervalMs;

    const payload = {
      type: 'candleSnapshot',
      req: {
        coin,
        interval,
        startTime: startTimeMs,
        endTime: endTimeMs
      }
    };

    const data = await this._post(payload);
    // Hyperliquid returns array directly
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }
}

module.exports = { HyperliquidClient };