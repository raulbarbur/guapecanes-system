/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // Esto permite cargar imágenes desde tu cuenta de Cloudinary
      },
    ],
  },
};

export default nextConfig;