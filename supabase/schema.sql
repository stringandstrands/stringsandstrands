-- ============================================================
-- Strings & Strands — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── 1. Products ─────────────────────────────────────────────
create table if not exists public.products (
  id              text primary key,
  name            text not null,
  category        text not null,
  price           integer not null,
  discounted_price integer not null,
  description     text,
  images          text[] not null default '{}',
  stock           integer not null default 50,
  metal           text,
  color           text,
  occasion        text,
  type            text,
  is_bestseller   boolean not null default false,
  is_new          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ─── 2. Addresses ────────────────────────────────────────────
create table if not exists public.addresses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  full_name       text not null,
  phone           text not null,
  address_line1   text not null,
  address_line2   text,
  city            text not null,
  state           text not null,
  pincode         text not null,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ─── 3. Cart Items ───────────────────────────────────────────
create table if not exists public.cart_items (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  session_id      text,                          -- for guest carts
  product_id      text not null references public.products(id) on delete cascade,
  quantity        integer not null default 1 check (quantity > 0),
  created_at      timestamptz not null default now(),
  constraint cart_owner check (user_id is not null or session_id is not null)
);

-- ─── 4. Wishlist Items ───────────────────────────────────────
create table if not exists public.wishlist_items (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  product_id      text not null references public.products(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(user_id, product_id)
);

-- ─── 5. Orders ───────────────────────────────────────────────
create table if not exists public.orders (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id),
  razorpay_order_id     text,
  razorpay_payment_id   text,
  status                text not null default 'pending'
                          check (status in ('pending','paid','shipped','delivered','cancelled')),
  total_amount          integer not null,          -- in paise
  shipping_address_id   uuid references public.addresses(id),
  shiprocket_order_id   text,
  awb_number            text,
  tracking_status       text,
  created_at            timestamptz not null default now()
);

-- ─── 6. Order Items ──────────────────────────────────────────
create table if not exists public.order_items (
  id                      uuid primary key default uuid_generate_v4(),
  order_id                uuid not null references public.orders(id) on delete cascade,
  product_id              text references public.products(id) on delete set null,  -- nullable: product may be deleted later
  quantity                integer not null,
  price_at_purchase       integer not null,          -- in paise
  product_name_snapshot   text,                      -- captured at order time so deleted products don't break history
  price_inr_snapshot      integer                    -- price in rupees at order time
);

-- ─── 7. Reviews ──────────────────────────────────────────────
create table if not exists public.reviews (
  id                    uuid primary key default uuid_generate_v4(),
  product_id            text not null references public.products(id) on delete cascade,
  user_id               uuid not null references auth.users(id),
  reviewer_name         text not null,
  rating                integer not null check (rating between 1 and 5),
  title                 text not null,
  review_text           text not null,
  image_urls            text[] not null default '{}',
  is_verified_purchase  boolean not null default false,
  created_at            timestamptz not null default now()
);

-- ─── 8. User Profiles (extends auth.users) ───────────────────
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Products: anyone can read, only service role can write
alter table public.products enable row level security;
create policy "products_read" on public.products for select using (true);
create policy "products_write" on public.products for all using (auth.role() = 'service_role');

-- Addresses: users see only their own
alter table public.addresses enable row level security;
create policy "addresses_owner" on public.addresses for all using (auth.uid() = user_id);

-- Cart: users see their own; guests see by session_id (handled client-side)
alter table public.cart_items enable row level security;
create policy "cart_user" on public.cart_items for all using (
  auth.uid() = user_id or user_id is null
);

-- Wishlist: users see only their own
alter table public.wishlist_items enable row level security;
create policy "wishlist_owner" on public.wishlist_items for all using (auth.uid() = user_id);

-- Orders: users see only their own; only service role can insert/update
alter table public.orders enable row level security;
create policy "orders_read_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_write_service" on public.orders for insert with check (auth.role() = 'service_role');
create policy "orders_update_service" on public.orders for update using (auth.role() = 'service_role');

-- Order items: users can read items for their orders
alter table public.order_items enable row level security;
create policy "order_items_read" on public.order_items for select using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "order_items_write_service" on public.order_items for insert with check (auth.role() = 'service_role');

-- Reviews: anyone can read; authenticated users can insert their own
alter table public.reviews enable row level security;
create policy "reviews_read" on public.reviews for select using (true);
create policy "reviews_insert" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- User profiles: users see only their own
alter table public.user_profiles enable row level security;
create policy "profiles_owner" on public.user_profiles for all using (auth.uid() = id);

-- ============================================================
-- STORAGE BUCKET for review images
-- Run this separately in the Supabase Dashboard > Storage
-- or via the API. SQL for bucket config:
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('review-images', 'review-images', true);
-- create policy "review_images_read" on storage.objects for select using (bucket_id = 'review-images');
-- create policy "review_images_insert" on storage.objects for insert with check (
--   bucket_id = 'review-images' and auth.role() = 'authenticated'
-- );
-- create policy "review_images_delete_own" on storage.objects for delete using (
--   bucket_id = 'review-images' and auth.uid()::text = (storage.foldername(name))[1]
-- );
