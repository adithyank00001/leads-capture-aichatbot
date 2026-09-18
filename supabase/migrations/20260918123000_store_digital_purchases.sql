-- Isolated digital store purchases (Razorpay). Not used by SaaS billing.
create table if not exists public.store_purchases (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null default 'poster-pack',
  product_title text not null,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  quantity integer not null default 1 check (quantity > 0),
  selections jsonb not null default '{}'::jsonb,
  customer_email text,
  customer_phone text,
  customer_name text,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  razorpay_signature text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  download_token text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists store_purchases_order_id_uidx
  on public.store_purchases (razorpay_order_id);

create unique index if not exists store_purchases_payment_id_uidx
  on public.store_purchases (razorpay_payment_id)
  where razorpay_payment_id is not null;

create index if not exists store_purchases_download_token_idx
  on public.store_purchases (download_token)
  where download_token is not null;

alter table public.store_purchases enable row level security;
