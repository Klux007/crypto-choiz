import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_VALIDATED: 'access_validated',
  COINGECKO_API_KEY: 'coingecko_api_key',
  LAST_PARAMS: 'last_params',
};

export const storage = {
  async isAccessValidated() {
    const val = await AsyncStorage.getItem(KEYS.ACCESS_VALIDATED);
    return val === 'true';
  },

  async setAccessValidated() {
    await AsyncStorage.setItem(KEYS.ACCESS_VALIDATED, 'true');
  },

  async getApiKey() {
    return AsyncStorage.getItem(KEYS.COINGECKO_API_KEY);
  },

  async setApiKey(key) {
    await AsyncStorage.setItem(KEYS.COINGECKO_API_KEY, key.trim());
  },

  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },

  async getLastParams() {
    const val = await AsyncStorage.getItem(KEYS.LAST_PARAMS);
    return val ? JSON.parse(val) : null;
  },

  async saveLastParams(params) {
    await AsyncStorage.setItem(KEYS.LAST_PARAMS, JSON.stringify(params));
  },
};