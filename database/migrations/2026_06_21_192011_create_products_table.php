<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('product_name');
            $table->string('barcode')->unique()->nullable(); // Kipengele cha Barcode Scanner
            $table->decimal('buying_price', 10, 2); // Mtaji wa bidhaa
            $table->decimal('selling_price', 10, 2); // Bei ya kuuzia mteja
            $table->integer('quantity')->default(0); // Real-time Stock quantity tracker
            $table->integer('low_stock_threshold')->default(5); // Low Stock Alert point
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('products'); }
};