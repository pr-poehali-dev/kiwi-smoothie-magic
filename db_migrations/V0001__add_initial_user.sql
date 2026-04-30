INSERT INTO t_p57925851_kiwi_smoothie_magic.users (email, password_hash)
VALUES (
    'maksimmmmmm12@gmail.com',
    encode(sha256(('eventpass_salt_2025Portalevents')::bytea), 'hex')
);
