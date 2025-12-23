// Teams & Players Domain
// Responsibility: Team and player management, including referees

export * from './services';
export * from './hooks';
// NOTE: Pages are NOT exported here to prevent circular dependencies in production builds
// Import pages directly from their file paths instead
