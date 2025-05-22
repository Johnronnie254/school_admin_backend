/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['educitebackend.co.ke', 'www.educitebackend.co.ke'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://www.educitebackend.co.ke/api/:path*',
      },
    ];
  },
  experimental: {
    appDir: true,
  },
};

export default nextConfig; 