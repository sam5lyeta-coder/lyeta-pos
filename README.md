# LYETA CLASSIC - Smart Sales & Real-time Inventory Management System

A modern, fast, and secure client-server Point of Sale (POS) and Inventory Management System designed specifically for **LYETA CLASSIC** retail store.

## Tech Stack
- **Frontend**: React.js, Vite, Custom CSS (Tailwind-free for maximum customization and styling control).
- **Backend**: Laravel REST API, Eloquent ORM.
- **Database**: MySQL.
- **Languages**: Swahili & English (Switchable with one click).

---

## Key Features

### 🌟 Admin Control Panel
1. **Real-time Sales & Profit Dashboard**: Real-time stats showing Daily Sales, Total Capital, Net Profits, and Total Items Sold with dynamic growth charts.
2. **Cashier Management**: Full controls to add, reset password, delete, or block/unblock cashier accounts.
3. **Inventory Management**: Add, edit, or delete items. Includes a Microsoft Excel/CSV bulk import module to upload thousands of products instantly.
4. **Security & Backup**: Toggle Two-Factor Authentication (2FA) globally for all users, and download a complete SQL database backup with one click.
5. **Activity Log / Audit Trail**: An immutable system log screen showing all critical admin and cashier actions for transparency.
6. **7-Day Dynamic Themes**: Elegant accent colors that automatically change every day of the week (7 rotating themes).

### 🛒 Cashier POS Panel
1. **Interactive POS Terminal**: Instant product search (by name or barcode scan), interactive cart, and payment processing (Cash, Bank, Mobile).
2. **Barcode Label Printer**: Generate and print labels formatted to fit exactly 3-per-row on standard A4 print sheets without page cuts.
3. **CRM Customer Registration**: Pre-filled country code `+255` and strict 13-character validation for standardized customer records.
4. **WhatsApp Digital Receipt**: Calculates VAT (18% inclusive) and Net Amount, generating a monospace receipt layout sent directly to client's WhatsApp.
5. **Two-Factor Authentication (2FA)**: High-security 6-digit email confirmation popup screen upon login.

---

## Installation & Setup Instructions

### 1. Prerequisites
- **XAMPP** (with PHP 8.2+ and MySQL).
- **Composer** (PHP dependency manager).
- **Node.js** (for Vite build tools).
- **Git** installed on your system.

### 2. Steps to Run Locally

#### Step A: Clone the Repository
```bash
git clone <your-repository-url>
cd sales-management-system
```

#### Step B: Install PHP and Frontend Dependencies
```bash
# Install PHP packages
composer install

# Install Node modules
npm install
```

#### Step C: Configure Environment Settings
1. Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set your MySQL database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sales_management_system_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Generate the application key:
   ```bash
   php artisan key:generate
   ```

#### Step D: Database Migrations & Seeds
1. Open XAMPP Control Panel and start **Apache** and **MySQL**.
2. Go to `phpMyAdmin` and create a database named `sales_management_system_db`.
3. Run the migrations to build the tables:
   ```bash
   php artisan migrate
   ```
4. (Optional) Run the database seeders for initial data.

#### Step E: Compile Assets & Start Servers
1. Build the production assets for the React frontend:
   ```bash
   npm run build
   ```
2. Start the Laravel development server:
   ```bash
   php artisan serve
   ```
3. Access the application in your browser at `http://127.0.0.1:8000` or through XAMPP's Apache alias directory path `http://localhost/sales-management-system/public/`.

---

## Licensing & Copyright
&copy; 2026 LYETA CLASSIC. All Rights Reserved. Created by Antigravity Software Architect.
