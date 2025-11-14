/**
 * Authentication utilities
 */

import { env } from "~/env.mjs";

export const AUTH_COOKIE_NAME = "sitemap_monitor_auth";
export const AUTH_COOKIE_VALUE = "authenticated";

/**
 * Verify password
 */
export function verifyPassword(password: string): boolean {
  return password === env.ADMIN_PASSWORD;
}

/**
 * Check if user is authenticated from cookie
 */
export function isAuthenticated(cookies: string | undefined): boolean {
  if (!cookies) return false;

  const authCookie = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));

  return authCookie === `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}`;
}

/**
 * Create auth cookie string
 */
export function createAuthCookie(): string {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  return `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

/**
 * Create logout cookie string
 */
export function createLogoutCookie(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
