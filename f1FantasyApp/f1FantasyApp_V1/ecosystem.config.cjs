module.exports = {
  apps: [
    {
      name: 'f1-backend',
      script: 'server.js',
      cwd: '/Users/maxfaulkner/Documents/GHPython/python/f1FantasyApp/f1FantasyApp_V1',
      watch: ['server.js', 'routes', 'services', 'jobs', 'middleware'],
      ignore_watch: ['node_modules', 'frontend'],
      env: {
        NODE_ENV: 'development',
        PATH: process.env.PATH,
      },
    },
    {
      name: 'f1-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/maxfaulkner/Documents/GHPython/python/f1FantasyApp/f1FantasyApp_V1/frontend',
      watch: false,
    },
  ],
};
