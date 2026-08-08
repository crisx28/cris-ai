-- ============================================================================
-- Cris Budget OS — OPTIONAL sample data for Supabase
-- ----------------------------------------------------------------------------
-- Fictional "Santos Family" demo data. Contains NO real/personal information.
-- The app itself starts every real user from an empty profile; this file is
-- only for populating a Supabase project with neutral sample rows if you want
-- to demo the cloud setup.
--
-- HOW TO USE:
--   1. Sign up / log in to the app once so your user exists in auth.users.
--   2. In Supabase SQL Editor, run:  select id, email from auth.users;
--   3. Replace the :uid line below with your auth user id, then run this file.
-- ============================================================================

\set uid 'REPLACE-WITH-YOUR-AUTH-USER-ID'

insert into public.incomes (user_id, date, source, amount, notes) values
  (:'uid', date_trunc('month', now()) + interval '14 day', 'Salary',   45000, 'Payroll'),
  (:'uid', date_trunc('month', now()) + interval '29 day', 'Salary',   22000, 'Payroll'),
  (:'uid', date_trunc('month', now()) + interval '21 day', 'Freelance', 8000, 'Side income');

insert into public.expenses (user_id, date, description, category, amount) values
  (:'uid', date_trunc('month', now()) + interval '4 day',  'Monthly rent',          'Rent',           18750),
  (:'uid', date_trunc('month', now()) + interval '7 day',  'Electricity bill',      'Utilities',       3750),
  (:'uid', date_trunc('month', now()) + interval '9 day',  'Internet bill',         'Internet',        1650),
  (:'uid', date_trunc('month', now()) + interval '11 day', 'Mobile plan',           'Mobile',           980),
  (:'uid', date_trunc('month', now()) + interval '2 day',  'Groceries',             'Grocery',         9000),
  (:'uid', date_trunc('month', now()) + interval '8 day',  'Dining out',            'Food',            3750),
  (:'uid', date_trunc('month', now()) + interval '14 day', 'School service',        'Child Expenses',  2620),
  (:'uid', date_trunc('month', now()) + interval '5 day',  'Credit Card payment',   'Debt Payment',    4000);

insert into public.fixed_expenses (user_id, name, category, amount, due_day, active) values
  (:'uid', 'Rent',           'Rent',           18750, 5,  true),
  (:'uid', 'Electricity',    'Utilities',       3750, 8,  true),
  (:'uid', 'Internet',       'Internet',        1650, 10, true),
  (:'uid', 'Mobile plan',    'Mobile',           980, 12, true),
  (:'uid', 'School service', 'Child Expenses',  2620, 15, true);

insert into public.debts (user_id, name, balance, interest_rate, monthly_payment, due_day) values
  (:'uid', 'Credit Card',   25000, 3.0, 4000, 6),
  (:'uid', 'Personal Loan', 20000, 1.5, 3000, 6);

insert into public.savings_goals (user_id, name, target, current, deadline) values
  (:'uid', 'Emergency Fund', 150000, 25000, now() + interval '14 month'),
  (:'uid', 'New Appliance',   35000,  9000, now() + interval '6 month');

insert into public.travel_funds (user_id, destination, target, current, travel_date) values
  (:'uid', 'Japan Vacation', 180000, 38000, now() + interval '8 month');
