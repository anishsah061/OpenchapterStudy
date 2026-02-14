// In a Monolith setup, the API is served from the same origin as the frontend.
// So we use a relative path (empty string) to let the browser resolve it.
// If we were split, we might use import.meta.env.VITE_API_URL
const API_URL = '';

export default API_URL;
