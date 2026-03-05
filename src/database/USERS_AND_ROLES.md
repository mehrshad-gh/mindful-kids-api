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

---

## Deactivate and delete (admin)

- **Soft deactivate**: `users.deactivated_at` (set by POST /admin/users/:id/deactivate). Deactivated users cannot log in; list/count exclude them unless `include_deactivated=1`. Reversible via POST /admin/users/:id/reactivate. Audit: `user_deactivated`, `user_reactivated`.
- **Hard delete**: DELETE /admin/users/:id is allowed only for `role = 'parent'`. The database CASCADE (see `children.parent_id` and `progress.child_id`) removes their children and progress. Audit: `user_deleted`. Use when a parent account and all associated data must be removed permanently.
