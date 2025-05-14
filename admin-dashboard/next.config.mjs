/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['educitebackend.co.ke'],
  },
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