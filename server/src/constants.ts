// process.env.NODE_ENV is special evironmental variable that set to be production when you are in production
export const __prod__ = process.env.NODE_ENV === "production"; //only true in development.
// cookie name
export const COOKIE_NAME = "RedditCloneCookies";
// prefix for forgot password token that will be helpful to find in redis
export const FORGOT_PASSWORD_PREFIX = "forgot-password:";
