module.exports = {
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "json"],
  transform: {
      '^.+\\.(js|jsx)?$': 'babel-jest'
  },
  testEnvironment: 'node',
  moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1'
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/']
};