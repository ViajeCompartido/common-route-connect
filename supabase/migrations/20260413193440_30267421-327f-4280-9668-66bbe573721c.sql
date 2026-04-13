
CREATE TABLE public.mercadopago_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('payer', 'collector')),
  mp_email TEXT,
  mp_user_id TEXT,
  access_token TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disconnected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_type)
);

ALTER TABLE public.mercadopago_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MP accounts"
ON public.mercadopago_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own MP accounts"
ON public.mercadopago_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MP accounts"
ON public.mercadopago_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MP accounts"
ON public.mercadopago_accounts FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_mercadopago_accounts_updated_at
BEFORE UPDATE ON public.mercadopago_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
