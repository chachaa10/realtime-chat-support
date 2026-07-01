ALTER TABLE messages ADD COLUMN status text NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'delivered', 'read'));
