CREATE TABLE IF NOT EXISTS fitness_backups (
  user_id text NOT NULL,
  profile_id text NOT NULL CHECK (profile_id ~ '^[a-f0-9]{16}$'),
  metadata jsonb NOT NULL,
  ciphertext text NOT NULL CHECK (left(ciphertext, 4) = 'enc:'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, profile_id),
  CHECK (octet_length(ciphertext) <= 2097152)
);
REVOKE ALL ON fitness_backups FROM PUBLIC;
