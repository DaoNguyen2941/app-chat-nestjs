import { registerAs } from "@nestjs/config";

export default registerAs('cfR2', () => ({
  bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
  accessId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  publicUrl: process.env.R2_PUBLIC_URL,
  endpoint: process.env.ENDPOINT
}));