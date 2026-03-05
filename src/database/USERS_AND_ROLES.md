# Users and roles – where to look

All **login accounts** live in the single table `users`, distinguished by `role`. For cleaner separation when querying or reporting, use the role-specific views. **Children** and **clinics** are separate entities.

| Type            | Where to look              | Notes |
|-----------------|----------------------------|--------|
| **Parents**     | `v_parents` (view)          | Subset of `users` where `role = 'parent'`. |
| **Therapists**   | `v_therapists` (view)       | Subset of `users` where `role = 'therapist'`. Public profile in `psychologists` (linked by `psychologists.user_id`). |
| **Clinic admins** | `v_clinic_admins` (view)  | Subset of `users` where `role = 'clinic_admin'`. Which clinics they manage: `clinic_admins` (user_id, clinic_id). |
| **Admins**      | `v_admins` (view)          | Subset of `users` where `role = 'admin'`. |
| **Children**    | `children` (table)         | Not login users. Linked to parent via `parent_id` → `users.id`. |
| **Clinics**     | `clinics` (table)          | Organizations. Admins linked via `clinic_admins`. |

## Views (read-only)

- `v_parents` – parents only  
- `v_therapists` – therapists only  
- `v_clinic_admins` – clinic admins only  
- `v_admins` – platform admins only  

Views expose `id`, `email`, `name`, `created_at`, `updated_at` (no `password_hash`).

## API

Use `User.listByRole('parent' | 'therapist' | 'clinic_admin' | 'admin')` to get users of one type (returns rows from the corresponding view).
