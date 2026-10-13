import type { NextConfig } from 'next';

const backendUrl = ('https://memed-payout-tracker.onrender.com').replace(/\/$/, '');
const config: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};
export default config;
