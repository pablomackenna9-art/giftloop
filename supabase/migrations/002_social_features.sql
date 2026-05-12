-- ─── FRIENDSHIPS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can insert own requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Addressee can update status" ON public.friendships FOR UPDATE USING (auth.uid() = addressee_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ─── WISH PURCHASES (mark as bought) ────────────────────────────────────────
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS purchased_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ;

-- ─── EVENTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE,
  location TEXT DEFAULT '',
  emoji TEXT DEFAULT '🎉',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Users can manage own events" ON public.events FOR ALL USING (auth.uid() = user_id);

-- ─── EVENT INVITES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, invitee_id)
);

ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invites" ON public.event_invites FOR SELECT USING (auth.uid() = invitee_id OR EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()));
CREATE POLICY "Event owner can insert invites" ON public.event_invites FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()));
CREATE POLICY "Invitee can update status" ON public.event_invites FOR UPDATE USING (auth.uid() = invitee_id);

-- ─── EVENT WISH LINKS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_wishes (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  wish_id UUID REFERENCES public.wishes(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, wish_id)
);

ALTER TABLE public.event_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view event_wishes" ON public.event_wishes FOR SELECT USING (true);
CREATE POLICY "Event owner can manage event_wishes" ON public.event_wishes FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND user_id = auth.uid()));

-- ─── FUND CONTRIBUTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fund_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fund_id UUID REFERENCES public.group_funds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fund_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fund owner can view contributions" ON public.fund_contributions FOR SELECT USING (true);
CREATE POLICY "Users can insert own contributions" ON public.fund_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update group_funds to link to a wish
ALTER TABLE public.group_funds ADD COLUMN IF NOT EXISTS wish_id UUID REFERENCES public.wishes(id) ON DELETE SET NULL;
ALTER TABLE public.group_funds ADD COLUMN IF NOT EXISTS product_name TEXT DEFAULT '';
ALTER TABLE public.group_funds ADD COLUMN IF NOT EXISTS product_image TEXT DEFAULT '';
