CREATE TABLE IF NOT EXISTS notifications (
  id integer PRIMARY KEY AUTOINCREMENT,
  user_id text NOT NULL REFERENCES profiles(id),
  type text NOT NULL CHECK(type IN ('ticket_assigned', 'ticket_resolved', 'ticket_cancelled', 'ticket_returned', 'new_message')),
  ticket_id integer NOT NULL REFERENCES tickets(id),
  message text NOT NULL,
  is_read integer NOT NULL DEFAULT 0,
  created_at integer NOT NULL
);
