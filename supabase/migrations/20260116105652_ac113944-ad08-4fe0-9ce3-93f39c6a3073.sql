-- Tornar due_date opcional na tabela payments
ALTER TABLE public.payments ALTER COLUMN due_date DROP NOT NULL;