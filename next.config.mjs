/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "permissiontrail.co.uk" }],
        destination: "https://www.permissiontrail.co.uk/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
