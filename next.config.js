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
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@remotion/bundler",
      "@remotion/renderer",
      "@rspack/core",
      "@rspack/binding",
    ],
  },
  async redirects() {
    return [
      { source: "/promotions", destination: "/promote", permanent: true },
      { source: "/promotions/new", destination: "/promote/new", permanent: true },
      { source: "/promotions/:id", destination: "/promote/:id", permanent: true },
      { source: "/queue", destination: "/promote", permanent: true },
      { source: "/calendar", destination: "/promote", permanent: true },
      { source: "/research", destination: "/content", permanent: true },
      { source: "/blog-posts", destination: "/content", permanent: true },
      { source: "/email-drafts", destination: "/content", permanent: true },
      { source: "/opportunities", destination: "/content", permanent: true },
      { source: "/templates", destination: "/settings", permanent: true },
      { source: "/schedule", destination: "/settings", permanent: true },
      { source: "/logs", destination: "/settings", permanent: true },
    ];
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
