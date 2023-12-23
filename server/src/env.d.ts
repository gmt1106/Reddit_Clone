declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      REDIS_URI: string;
      PORT: string;
      SESSION_SECRET: string;
      CORS_ORIGIN: string;
      EMAIL_SERVICE: string;
      EMAIL_HOST: string;
      EMAIL_USER: string;
      EMAIL_PASS: string;
    }
  }
}

export {}
