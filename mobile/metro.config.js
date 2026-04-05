const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root is one level up from mobile/
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so Metro sees changes in shared/
config.watchFolders = [...(config.watchFolders || []), monorepoRoot, projectRoot];

// Tell Metro where to look for modules — project-local first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;