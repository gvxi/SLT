import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
	turbopack: {
		root: process.cwd(),
	},
	experimental: {
		outputFileTracingExcludes: {
			"*": [
				"./node_modules/@react-pdf/**/*",
				"./node_modules/fontkit/**/*",
				"./node_modules/brotli/**/*",
			],
		},
	},
};

export default nextConfig;
