import { AdsBackend } from './types';

/** Does nothing and never shows an ad. Used on web, in Jest, and when unconfigured. */
export const noopBackend: AdsBackend = {
  async initialize() {},
  async loadInterstitial() {},
  async showInterstitial() {
    return false;
  },
};
