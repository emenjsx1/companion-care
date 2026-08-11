-- Add admin role for emenjoseph7@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('15011c1e-8ace-40b4-b1f8-18d8a3f0d2d1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;