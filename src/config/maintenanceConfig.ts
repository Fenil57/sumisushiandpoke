/**
 * Global Maintenance Mode Configuration for Sumi Sushi
 * 
 * Set `MAINTENANCE_MODE` to `true` to activate Global Maintenance Mode across the entire website.
 * Set to `false` when you want to restore the live restaurant website.
 * 
 * Can also be controlled via environment variable `VITE_MAINTENANCE_MODE=true` or `false`.
 */
export const MAINTENANCE_MODE: boolean =
  import.meta.env.VITE_MAINTENANCE_MODE !== undefined
    ? import.meta.env.VITE_MAINTENANCE_MODE === "true"
    : true;
