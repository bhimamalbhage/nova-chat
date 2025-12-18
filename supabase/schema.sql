-- Create chats table
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  title text not null,
  user_id uuid references auth.users(id) not null,
  visibility text check (visibility in ('public', 'private')) default 'private' not null
);

-- Create messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null,
  parts jsonb not null,
  attachments jsonb default '[]'::jsonb not null,
  created_at timestamptz default now() not null
);

-- Create streams table
create table if not exists streams (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table chats enable row level security;
alter table messages enable row level security;
alter table streams enable row level security;

-- Policies for chats
create policy "Users can view their own chats" on chats
  for select using (auth.uid() = user_id);

create policy "Users can insert their own chats" on chats
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own chats" on chats
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chats" on chats
  for delete using (auth.uid() = user_id);

-- Policies for messages (simplified: access enabled if user has access to chat)
create policy "Users can view messages in their chats" on messages
  for select using (
    exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
  );

create policy "Users can insert messages in their chats" on messages
  for insert with check (
    exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
  );

create policy "Users can delete messages in their chats" on messages
  for delete using (
    exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
  );
