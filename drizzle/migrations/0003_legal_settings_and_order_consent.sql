CREATE TABLE public.store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  legal_name text NOT NULL DEFAULT 'ThePoshakCo',
  registered_address text NOT NULL DEFAULT 'Mahalaxmi Chambers, Railway Colony, Shahupuri, Kolhapur, Maharashtra, India',
  gstin text NOT NULL DEFAULT '',
  support_email text NOT NULL DEFAULT 'ThePoshakco@gmail.com',
  support_phone text NOT NULL DEFAULT '+91 88883 15454',
  grievance_officer_name text NOT NULL DEFAULT 'Grievance Officer, ThePoshakCo',
  grievance_officer_email text NOT NULL DEFAULT 'ThePoshakco@gmail.com',
  free_shipping_threshold integer NOT NULL DEFAULT 999 CHECK (free_shipping_threshold >= 0),
  return_window_days integer NOT NULL DEFAULT 7 CHECK (return_window_days >= 0),
  refund_timeline_days integer NOT NULL DEFAULT 7 CHECK (refund_timeline_days >= 0),
  shipping_time text NOT NULL DEFAULT '4–7 business days',
  jurisdiction_city text NOT NULL DEFAULT 'Kolhapur, Maharashtra',
  policy_version text NOT NULL DEFAULT '1.0',
  policy_updated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin update" ON public.store_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.policy_pages (
  slug text PRIMARY KEY,
  body text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.policy_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.policy_pages TO authenticated;
GRANT ALL ON public.policy_pages TO service_role;
ALTER TABLE public.policy_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policies public read" ON public.policy_pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "policies admin write" ON public.policy_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.orders
  ADD COLUMN terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN terms_accepted_at timestamptz,
  ADD COLUMN policy_version text,
  ADD COLUMN marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN marketing_consent_at timestamptz;