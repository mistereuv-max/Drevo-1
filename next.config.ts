import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    // Позволяет загружать фото через Server Actions без падения на больших файлах.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
