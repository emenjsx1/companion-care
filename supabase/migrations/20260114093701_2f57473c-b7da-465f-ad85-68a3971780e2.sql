-- Create trigger to automatically set payment_date when status changes to 'paid'
CREATE OR REPLACE FUNCTION public.set_payment_date_on_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changing to 'paid' and payment_date is NULL
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid' OR OLD.status IS NULL) THEN
    -- Set payment_date to current date if not already set
    IF NEW.payment_date IS NULL THEN
      NEW.payment_date := CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_payment_date_on_paid ON public.payments;
CREATE TRIGGER trigger_set_payment_date_on_paid
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payment_date_on_paid();

-- Also handle INSERT with status = 'paid'
DROP TRIGGER IF EXISTS trigger_set_payment_date_on_insert ON public.payments;
CREATE TRIGGER trigger_set_payment_date_on_insert
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND NEW.payment_date IS NULL)
  EXECUTE FUNCTION public.set_payment_date_on_paid();