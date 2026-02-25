-- Drop the existing grade check constraint and allow any grade value
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_grade_check;