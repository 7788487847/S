DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='commission_open') THEN
        UPDATE users SET commission_status = 1 WHERE commission_open = true;
    END IF;
END 
$$;
