export const CONFIG = {
  SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL!,
  WS_URL: process.env.NEXT_PUBLIC_WS_URL!,
  API_TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT),
} as const;
