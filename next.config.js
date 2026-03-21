import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@remotion/bundler",
      "@remotion/renderer",
      "@rspack/core",
      "@rspack/binding",
    ],
  },
};

const path = require("path");

/** @param {import('webpack').Configuration} config */
function withContentlayerStub(config) {
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};
  config.resolve.alias["contentlayer/generated"] = path.resolve(
    __dirname,
    "lib/contentlayer-stub/generated.js",
  );
  config.resolve.alias["@/.contentlayer/generated"] = path.resolve(
    __dirname,
    "lib/contentlayer-stub/generated.js",
  );
  return config;
}

const configWithWebpack = {
  ...nextConfig,
  webpack(config, options) {
    if (nextConfig.webpack) config = nextConfig.webpack(config, options);
    return withContentlayerStub(config);
  },
};

module.exports = configWithWebpack;
