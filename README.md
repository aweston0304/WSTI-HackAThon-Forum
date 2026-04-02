Project Dashboard

## Setup Instructions
1. **Clone the repo:** `git clone <your-repo-url>`
2. **Create Virtual Env:** `python -m venv venv`
3. **Activate Env:** `source venv/bin/activate` (Mac) or `venv\Scripts\activate` (Windows)
4. **Install Requirements:** `pip install -r requirements.txt`
5. **Database Setup:** - Create a Postgres DB named `dashboard_db`.
   - Run `psql -d dashboard_db -f schema.sql` to create tables.
6. **Environment Variables:**
   - Create a `.env` file and add your `DATABASE_URL` or credentials.
