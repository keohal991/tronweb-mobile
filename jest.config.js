module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: ['/node_modules/(?!eventemitter3)'],
    moduleNameMapper: {
        '^../dist/TronWeb$': '<rootDir>/tests/__mocks__/TronWeb.js',
        '^../package\\.json$': '<rootDir>/package.json',
    },
};
