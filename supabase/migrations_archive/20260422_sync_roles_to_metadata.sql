-- ⚡ Stateless Auth Optimization: Syncing Roles to JWT Metadata
-- Objective: Allow the application to read user roles directly from the JWT (Stateless)
-- without hitting the 'profiles' table on every request.

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION fn_sync_profile_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the role in auth.users app_metadata
    -- This data will be encoded into the user's JWT automatically on next refresh
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach Trigger to profiles table
DROP TRIGGER IF EXISTS trg_sync_profile_role ON profiles;
CREATE TRIGGER trg_sync_profile_role
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_profile_role_to_auth();

-- 3. Initial Sync: Push current roles into metadata for all existing users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, role FROM profiles LOOP
        UPDATE auth.users
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', r.role)
        WHERE id = r.id;
    END LOOP;
END $$;
