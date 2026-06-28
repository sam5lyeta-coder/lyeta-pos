<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        // Akaunti za kuingilia
        User::create(['name' => 'Bosi Eltony', 'email' => 'admin@gmail.com', 'password' => Hash::make('123'), 'plain_password' => \Illuminate\Support\Facades\Crypt::encryptString('123'), 'role' => 'admin', 'status' => 'active']);
        User::create(['name' => 'Cashier Juma', 'email' => 'cashier@gmail.com', 'password' => Hash::make('123'), 'plain_password' => \Illuminate\Support\Facades\Crypt::encryptString('123'), 'role' => 'cashier', 'status' => 'active']);
    }
}