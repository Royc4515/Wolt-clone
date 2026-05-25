const env = {
  PORT: Number(process.env.PORT) || 3000,
  EX2_HOST: process.env.EX2_HOST || 'ex2-server',
  EX2_PORT: Number(process.env.EX2_PORT) || 8080,
};

module.exports = env;
