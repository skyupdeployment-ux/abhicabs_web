/**
 * src/lib/apiBase.js
 *
 * SINGLE SOURCE OF TRUTH for the backend API URL.
 * Every file that talks to the backend imports from here.
 *
 * Set your backend URL in .env:
 *   VITE_API_BASE_URL=https://your-backend.amazonaws.com/api/v1
 *
 * If not set, a warning is logged and API calls will fail gracefully.
 */

const FALLBACK = "https://api.abhicabs24x7.com/api/v1";
const ENV_URL = import.meta.env.VITE_API_BASE_URL || FALLBACK;

/** Full API base with /api/v1 suffix (e.g. https://host.com/api/v1) */
export const API_URL = ENV_URL;

/** API base WITHOUT /api/v1 suffix (e.g. https://host.com) */
export const API_ROOT = ENV_URL.replace(/\/api\/v1\/?$/, "");
