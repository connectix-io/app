-- Conversations — event store + read model (CQRS).
--
-- Write side: ONE append-only table, `events`. Every change is a new row:
--   conversation.opened    {contact_name, contact_phone, channel, language}
--   message.added          {channel, direction: in|out, text}
--   note.added             {text}
--   call.logged            {direction: in|out, duration_sec, summary, call_uuid}
--   status.changed         {status: open|pending|resolved}
--   conversation.assigned  {assignee}   -- assignee email, '' = unassigned
-- Rows are never updated or deleted (no UPDATE/DELETE policy).
--
-- Read side: the `conversations` view folds each stream into one row. Nothing
-- else is stored; add a materialized projection only if the fold gets slow.
--
-- Apply once: Supabase Dashboard → SQL Editor → paste → Run.

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  stream_id   uuid        not null,                    -- the conversation
  type        text        not null check (type in (
                'conversation.opened', 'message.added', 'note.added',
                'call.logged', 'status.changed', 'conversation.assigned')),
  data        jsonb       not null default '{}'::jsonb,
  actor_id    uuid        not null default auth.uid(),  -- who appended it
  created_at  timestamptz not null default now()
);

create index if not exists events_stream_idx on public.events (stream_id, id);
create index if not exists events_created_idx on public.events (created_at desc);

-- Append-only, signed-in users only.
alter table public.events enable row level security;

drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to authenticated using (true);

drop policy if exists events_append on public.events;
create policy events_append on public.events
  for insert to authenticated with check (actor_id = auth.uid());

revoke update, delete, truncate on public.events from anon, authenticated;
revoke all on public.events from anon;

-- Read model: one row per conversation. security_invoker → the caller's RLS applies.
create or replace view public.conversations with (security_invoker = true) as
select
  e.stream_id                                                                                   as id,
  (array_agg(e.data->>'contact_name'  order by e.id) filter (where e.type = 'conversation.opened'))[1] as contact_name,
  (array_agg(e.data->>'contact_phone' order by e.id) filter (where e.type = 'conversation.opened'))[1] as contact_phone,
  (array_agg(e.data->>'channel'       order by e.id) filter (where e.type = 'conversation.opened'))[1] as channel,
  (array_agg(e.data->>'language'      order by e.id) filter (where e.type = 'conversation.opened'))[1] as language,
  coalesce((array_agg(e.data->>'status' order by e.id desc) filter (where e.type = 'status.changed'))[1], 'open') as status,
  nullif((array_agg(e.data->>'assignee' order by e.id desc) filter (where e.type = 'conversation.assigned'))[1], '') as assignee,
  (array_agg(coalesce(e.data->>'text', e.data->>'summary') order by e.id desc)
     filter (where e.type in ('message.added', 'note.added', 'call.logged')))[1]                 as last_text,
  (array_agg(e.type order by e.id desc)
     filter (where e.type in ('message.added', 'note.added', 'call.logged')))[1]                 as last_kind,
  count(*) filter (where e.type in ('message.added', 'call.logged'))                            as message_count,
  min(e.created_at)                                                                             as created_at,
  max(e.created_at)                                                                             as updated_at
from public.events e
group by e.stream_id;

grant select on public.conversations to authenticated;

-- Live updates: the app listens for new events and refreshes its views.
do $$
begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null;
end $$;
