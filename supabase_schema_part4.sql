-- Universal Firestore Adapter Table
-- Run this in Supabase SQL editor to enable the firebase/firestore Vite alias mock

CREATE TABLE IF NOT EXISTS firestore_docs (
  id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at BIGINT,
  updated_at BIGINT,
  PRIMARY KEY (collection_id, id)
);

DO $$
BEGIN
    alter publication supabase_realtime add table firestore_docs;
EXCEPTION WHEN OTHERS THEN
END;
$$;
