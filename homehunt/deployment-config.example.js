// Copy to deployment-config.js only in the sanitized deployment checkout.
// The Supabase publishable key is designed to be public; database access remains
// protected by private tables and token-checking RPC functions. Never put the
// household passphrase, a passphrase hash, addresses, or financial data here.
window.HOMEHUNT_CONFIG = {
  mode: "supabase",
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseKey: "YOUR_SUPABASE_PUBLISHABLE_KEY",
  authEndpoint: "https://YOUR_PROJECT.supabase.co/functions/v1/homehunt-open-session",
  workspaceSlug: "USER_SUPPLIED_NON_IDENTIFYING_SLUG",
};
