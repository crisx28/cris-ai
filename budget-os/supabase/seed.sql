-- ============================================================================
-- Cris Budget OS — sample data for Supabase (optional)
-- ----------------------------------------------------------------------------
-- The app already ships with realistic sample data in demo mode. This file is
-- for loading sample rows into Supabase AFTER you've created an account.
--
-- HOW TO USE:
--   1. Sign up / log in to the app once so your user exists in auth.users.
--   2. In Supabase SQL Editor, run:  select id, email from auth.users;
--   3. Copy your user id, paste it into :uid below (replace the whole line),
--      then run this file.
-- ============================================================================

-- Replace this with your real auth user id, e.g.
--   \set uid '00000000-0000-0000-0000-000000000000'
\set uid 'REPLACE-WITH-YOUR-AUTH-USER-ID'

insert into public.incomes (user_id, date, source, amount, notes) values
  (:'uid', date_trunc('month', now()) + interval '14 day', 'Salary',   22500, 'Mid-month payroll'),
  (:'uid', date_trunc('month', now()) + interval '29 day', 'Salary',   22500, 'End-month payroll'),
  (:'uid', date_trunc('month', now()) + interval '21 day', 'Freelance', 9000, 'VA / automation gig'),
  (:'uid', date_trunc('month', now()) + interval '4 day',  'Bonus',     8000, 'Performance incentive');

insert into public.expenses (user_id, date, description, category, amount) values
  (:'uid', date_trunc('month', now()) + interval '4 day',  'Apartment rent',        'Rent',          12000),
  (:'uid', date_trunc('month', now()) + interval '7 day',  'Meralco electricity',   'Utilities',      3800),
  (:'uid', date_trunc('month', now()) + interval '9 day',  'PLDT Home Fibr',        'Internet',       1699),
  (:'uid', date_trunc('month', now()) + interval '11 day', 'Globe postpaid',        'Mobile',          999),
  (:'uid', date_trunc('month', now()) + interval '2 day',  'SM Supermarket',        'Grocery',        4200),
  (:'uid', date_trunc('month', now()) + interval '8 day',  'Jollibee family dinner','Food',            890),
  (:'uid', date_trunc('month', now()) + interval '14 day', 'School service',        'Child Expenses', 2600),
  (:'uid', date_trunc('month', now()) + interval '5 day',  'Credit card payment',   'Debt Payment',   5000);

insert into public.fixed_expenses (user_id, name, category, amount, due_day, active) values
  (:'uid', 'Apartment rent',      'Rent',           12000, 5,  true),
  (:'uid', 'Meralco electricity', 'Utilities',       3800, 8,  true),
  (:'uid', 'PLDT internet',       'Internet',        1699, 10, true),
  (:'uid', 'Globe postpaid',      'Mobile',           999, 12, true),
  (:'uid', 'School service',      'Child Expenses',  2600, 15, true),
  (:'uid', 'Mama allowance',      'Miscellaneous',   3000, 20, true);

insert into public.debts (user_id, name, balance, interest_rate, monthly_payment, due_day) values
  (:'uid', 'BPI Credit Card',        34500, 3.5, 5000, 6),
  (:'uid', 'Personal Loan (SB)',     78000, 1.8, 4500, 6),
  (:'uid', 'Appliance Installment',  14200, 0.0, 2400, 15);

insert into public.savings_goals (user_id, name, target, current, deadline) values
  (:'uid', 'Emergency Fund',      150000, 46500, now() + interval '14 month'),
  (:'uid', 'China Trip',          120000, 38000, now() + interval '4 month'),
  (:'uid', 'Joaquin School Fund',  60000, 22500, now() + interval '10 month'),
  (:'uid', 'New Laptop',           55000, 12000, now() + interval '6 month');

insert into public.travel_funds (user_id, destination, target, current, travel_date) values
  (:'uid', 'Beijing, China',        120000, 38000, now() + interval '4 month'),
  (:'uid', 'Boracay Family Getaway', 45000, 15500, now() + interval '8 month');
