# Scripts

## Set an admin user

Makes a user an admin so they see "Open verification" after login.

**1. Create the user (if needed)**  
In the app: **Register** with the email and password you want for admin.

**2. Get DATABASE_URL from Railway (no CLI needed)**  
- Open [Railway](https://railway.com) → your project.  
- Click your **Postgres** service.  
- Open the **Variables** tab.  
- Copy **`DATABASE_PUBLIC_URL`** (for running from your computer). If you don’t see it, use **`DATABASE_URL`** and, if the script can’t connect, switch to the public URL from the **Connect** tab.

**3. Put it in the project’s .env**  
- In the **mindful-kids-api** folder (same folder as `package.json`), open or create a file named **`.env`**.  
- Add (use the **public** URL when running from your Mac):
  ```
  DATABASE_URL=postgresql://postgres:xxxxx@xxxx.railway.app:5432/railway
  ALLOW_ADMIN_PROMOTION=true
  ```
  **Security:** The script only runs when `ALLOW_ADMIN_PROMOTION=true`. This prevents accidental admin creation (e.g. in production). Set it when you intend to promote an admin, then you can unset it.

- Save the file.

**4. Run the script**  
In a terminal, from the **mindful-kids-api** folder:

```bash
cd /Users/mehrshadghasemi/mindful-kids-api
npm run set-admin -- your@email.com
```

Replace `your@email.com` with the email you used to register.  
If you see **"Done. Admin set: ..."**, you’re good.  
The promotion is logged in the `admin_promotions_log` table for audit (run `npm run migrate` first if you haven’t).

**5. Sign in**  
Open the app → **Login** with that email and password → you’ll see **Open verification**.
