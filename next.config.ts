import type { NextConfig } from "next";

// @electric-sql/pglite 运行时按需加载 wasm 资产, 必须留在 server 端外部
// 依赖中, 否则 Webpack/Turbopack 打包后找不到 wasm 文件.
//
// allowedDevOrigins 放行沙箱预览反代域名. Next 15.2.2+ 在 dev 模式对
// _next/* 端点 (含 webpack-hmr WebSocket) 启用 cross-origin 校验, 默认仅
// 允许 localhost; 预览通过子域名反代 3000 端口, origin 非 localhost 会被
// 拒, 表现为页面不 hydrate/卡在初始加载. 详见 vercel/next.js#77253.
// 域名跟沙箱账号走 (e2b / 自建集群各不同), 由平台在创建沙箱时注入
// LUFFY_PREVIEW_ORIGINS (逗号分隔 *.域 通配), 此处只读 env 不硬编码.
const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  allowedDevOrigins:
    process.env.LUFFY_PREVIEW_ORIGINS?.split(",").filter(Boolean) ?? [],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
