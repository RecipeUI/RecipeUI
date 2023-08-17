/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["types", "ui"],
};

module.exports = nextConfig;
