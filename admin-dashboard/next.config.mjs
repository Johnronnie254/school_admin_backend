/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://educitebackend.co.ke/api/:path*',
      },
    ];
  },
};

export default nextConfig; 