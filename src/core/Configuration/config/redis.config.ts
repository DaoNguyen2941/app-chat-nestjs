import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  const host = process.env.REDIS_HOST!;
  const port = parseInt(process.env.REDIS_PORT!, 10);
  const db = parseInt(process.env.REDIS_DB!, 10) || 0;
  const password = process.env.REDIS_PASSWORD || null;
  const user = process.env.REDIS_USER || null;

  // Nếu có REDIS_URL thì dùng luôn, nếu không thì tự tạo
  const url =
    process.env.REDIS_URL ||
    (user
      ? `redis://${user}:${password}@${host}:${port}/${db}`
      : password
      ? `redis://:${password}@${host}:${port}/${db}`
      : `redis://${host}:${port}/${db}`);

  return {
    host,
    port,
    db,
    password,
    user,
    url,
  };
});
