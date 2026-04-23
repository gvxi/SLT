import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
    outputFileTracingExcludes: {
	"*": [
        	"./node_modules/@react-pdf/**/*",
			"./node_modules/fontkit/**/*",
			"./node_modules/brotli/**/*",
		],
	},
	turbopack: {
		root: process.cwd(),
	},
	experimental: {
	},
};

export default nextConfig;
