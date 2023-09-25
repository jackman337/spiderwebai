CREATE OR REPLACE FUNCTION handle_deleted_auth_user()
RETURNS TRIGGER AS $$
BEGIN

UPDATE public.profiles
SET is_deleted = true
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE or REPLACE TRIGGER on_auth_user_deleted
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_deleted_auth_user();