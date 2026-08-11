-- Create payment_methods table for managing available payment methods
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING ((is_active = true) OR is_admin());

CREATE POLICY "Admins can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods for Mozambique
INSERT INTO public.payment_methods (name, code, sort_order) VALUES
  ('M-Pesa', 'mpesa', 1),
  ('e-Mola', 'emola', 2),
  ('Conta Móvel', 'conta_movel', 3),
  ('Transferência Bancária', 'transferencia', 4),
  ('Dinheiro', 'dinheiro', 5),
  ('Ponto 24', 'ponto24', 6),
  ('Cheque', 'cheque', 7);