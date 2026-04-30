CREATE TABLE t_p57925851_kiwi_smoothie_magic.events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP,
    location VARCHAR(255),
    max_participants INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
