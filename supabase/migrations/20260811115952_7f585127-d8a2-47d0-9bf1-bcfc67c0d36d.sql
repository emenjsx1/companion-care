CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE public.exam_status AS ENUM ('scheduled', 'passed', 'failed', 'cancelled');
CREATE TYPE public.course_category AS ENUM ('A', 'B', 'C', 'D', 'E', 'ACC', 'A1', 'A2', 'C1', 'CE');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category course_category NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  license_number TEXT,
  birth_date DATE,
  address TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  document_number TEXT,
  branch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_user_id ON public.students(user_id);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_date DATE,
  due_date DATE,
  description TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  exam_type TEXT NOT NULL,
  exam_date TIMESTAMPTZ NOT NULL,
  status exam_status NOT NULL DEFAULT 'scheduled',
  score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID,
  recipient_id UUID,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender_user_id UUID NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error TEXT,
  campaign_name TEXT
);
CREATE INDEX idx_whatsapp_message_logs_created_at ON public.whatsapp_message_logs (created_at DESC);

CREATE TABLE public.whatsapp_received_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_phone TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  instance_name TEXT NOT NULL DEFAULT 'rodauto',
  remote_jid TEXT,
  message_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_whatsapp_received_created_at ON public.whatsapp_received_messages(created_at DESC);

CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.user_roles, public.courses, public.students, public.payments, public.exams, public.messages, public.contact_messages, public.whatsapp_message_logs, public.whatsapp_received_messages, public.gallery_images, public.school_settings, public.payment_methods, public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.whatsapp_received_messages TO anon;
GRANT SELECT ON public.courses, public.gallery_images, public.payment_methods TO anon;
GRANT ALL ON public.profiles, public.user_roles, public.courses, public.students, public.payments, public.exams, public.messages, public.contact_messages, public.whatsapp_message_logs, public.whatsapp_received_messages, public.gallery_images, public.school_settings, public.payment_methods, public.push_subscriptions TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_received_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_school_settings_updated_at BEFORE UPDATE ON public.school_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_payment_date_on_paid()
RETURNS TRIGGER AS $$ BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid' OR OLD.status IS NULL) THEN
    IF NEW.payment_date IS NULL THEN NEW.payment_date := CURRENT_DATE; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_set_payment_date_on_paid BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_payment_date_on_paid();
CREATE TRIGGER trigger_set_payment_date_on_insert BEFORE INSERT ON public.payments FOR EACH ROW WHEN (NEW.status = 'paid' AND NEW.payment_date IS NULL) EXECUTE FUNCTION public.set_payment_date_on_paid();

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin());

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin());

CREATE POLICY "Students can view own data" ON public.students FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (public.is_admin());

CREATE POLICY "Students can view own payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE students.id = payments.student_id AND students.user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (public.is_admin());

CREATE POLICY "Students can view own exams" ON public.exams FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE students.id = exams.student_id AND students.user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.is_admin());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can manage messages" ON public.messages FOR ALL USING (public.is_admin());

CREATE POLICY "Public can submit contact form" ON public.contact_messages FOR INSERT WITH CHECK (name IS NOT NULL AND email IS NOT NULL AND message IS NOT NULL);
CREATE POLICY "Admins can manage contacts" ON public.contact_messages FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view WhatsApp logs" ON public.whatsapp_message_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert WhatsApp logs" ON public.whatsapp_message_logs FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view received messages" ON public.whatsapp_received_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update received messages" ON public.whatsapp_received_messages FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete received messages" ON public.whatsapp_received_messages FOR DELETE USING (public.is_admin());
CREATE POLICY "Allow webhook inserts" ON public.whatsapp_received_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view active gallery images" ON public.gallery_images FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage school settings" ON public.school_settings FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (public.is_admin());

CREATE POLICY "Users can manage their own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view gallery images" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND public.is_admin());
CREATE POLICY "Admins can update gallery images" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND public.is_admin());
CREATE POLICY "Admins can delete gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND public.is_admin());