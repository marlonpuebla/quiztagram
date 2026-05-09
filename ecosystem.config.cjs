module.exports = {
  apps: [{
    name: 'quiztagram',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
  }],
}
