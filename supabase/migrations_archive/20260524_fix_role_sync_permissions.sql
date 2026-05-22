-- 🛠️ FIX: Restore Security Definer for Role Sync Function
-- This function was accidentally downgraded to SECURITY INVOKER in a previous security hardening migration.
-- It MUST be SECURITY DEFINER to allow syncing roles to auth.users metadata, as normal users (even admins)
-- do not have direct UPDATE permissions on the 'auth.users' table.

ALTER FUNCTION public.fn_sync_profile_role_to_auth() SECURITY DEFINER;

-- Re-enforce search path to include auth schema for safety
ALTER FUNCTION public.fn_sync_profile_role_to_auth() SET search_path = public, auth, extensions;

-- Ensure the function is not revoked from being executed by the trigger
GRANT EXECUTE ON FUNCTION public.fn_sync_profile_role_to_auth() TO authenticated, service_role;
