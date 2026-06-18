export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  cors: {
    origins: (
      process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
});
