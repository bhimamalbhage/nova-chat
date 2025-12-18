-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Chat Table
create table "Chat" (
  id uuid primary key default uuid_generate_v4(),
  "createdAt" timestamp with time zone not null default now(),
  title text not null,
  "userId" uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('public', 'private'))
);

-- Message Table (v2 structure from messages-memory)
create table "Message" (
  id uuid primary key default uuid_generate_v4(),
  "chatId" uuid not null references "Chat"(id) on delete cascade,
  role text not null,
  parts jsonb not null,
  attachments jsonb not null default '[]'::jsonb,
  "createdAt" timestamp with time zone not null default now()
);

-- Vote Table
create table "Vote" (
  "chatId" uuid not null references "Chat"(id) on delete cascade,
  "messageId" uuid not null references "Message"(id) on delete cascade,
  "isUpvoted" boolean not null,
  primary key ("chatId", "messageId")
);

-- Document Table
create table "Document" (
  id uuid not null default uuid_generate_v4(),
  "createdAt" timestamp with time zone not null default now(),
  title text not null,
  content text,
  kind text not null default 'text' check (kind in ('text', 'code', 'image', 'sheet')),
  "userId" uuid not null references auth.users(id) on delete cascade,
  primary key (id, "createdAt")
);

-- Suggestion Table
create table "Suggestion" (
  id uuid primary key default uuid_generate_v4(),
  "documentId" uuid not null,
  "documentCreatedAt" timestamp with time zone not null,
  "originalText" text not null,
  "suggestedText" text not null,
  description text,
  "isResolved" boolean not null default false,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "createdAt" timestamp with time zone not null default now(),
  foreign key ("documentId", "documentCreatedAt") references "Document"(id, "createdAt") on delete cascade
);

-- Stream Table (if needed, present in messages-memory)
create table "Stream" (
  id uuid primary key default uuid_generate_v4(),
  "chatId" uuid not null references "Chat"(id) on delete cascade,
  "createdAt" timestamp with time zone not null default now()
);

-- RLS Policies (Basic)

alter table "Chat" enable row level security;
alter table "Message" enable row level security;
alter table "Vote" enable row level security;
alter table "Document" enable row level security;
alter table "Suggestion" enable row level security;
alter table "Stream" enable row level security;

-- Chat Policies
create policy "Users can view their own chats" on "Chat"
  for select using (auth.uid() = "userId");
  
create policy "Users can insert their own chats" on "Chat"
  for insert with check (auth.uid() = "userId");

create policy "Users can update their own chats" on "Chat"
  for update using (auth.uid() = "userId");

create policy "Users can delete their own chats" on "Chat"
  for delete using (auth.uid() = "userId");

-- Message Policies (inherit from Chat access ideally, but for now simple owner check via join or just open for chat owner)
-- For simplicity, assuming if you can see the chat, you can see messages.
create policy "Users can view messages of their chats" on "Message"
  for select using (
    exists (
      select 1 from "Chat"
      where "Chat".id = "Message"."chatId"
      and "Chat"."userId" = auth.uid()
    )
  );

create policy "Users can insert messages to their chats" on "Message"
  for insert with check (
    exists (
      select 1 from "Chat"
      where "Chat".id = "Message"."chatId"
      and "Chat"."userId" = auth.uid()
    )
  );

-- Document Policies
create policy "Users can view their own documents" on "Document"
  for select using (auth.uid() = "userId");
  
create policy "Users can insert their own documents" on "Document"
  for insert with check (auth.uid() = "userId");
  
create policy "Users can update their own documents" on "Document"
  for update using (auth.uid() = "userId");
  
create policy "Users can delete their own documents" on "Document"
  for delete using (auth.uid() = "userId");

