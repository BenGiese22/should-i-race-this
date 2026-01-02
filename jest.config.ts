import type { Config } from "jest";

const config: Config = {
    verbose: true,
    preset: "ts-jest",
    testEnvironment: "jsdom",

    // Where tests live
    testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],

    // Allow absolute imports like "@/lib/..."
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },

    // Ignore Next build output
    testPathIgnorePatterns: ["/node_modules/", "/.next/"],

    // Optional but nice defaults
    clearMocks: true,
    restoreMocks: true,
};

export default config;
