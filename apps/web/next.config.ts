import type { NextConfig } from "next"

const config: NextConfig = {
  transpilePackages: ["@paige/ui"],
  agentRules: false,
}

export default config
