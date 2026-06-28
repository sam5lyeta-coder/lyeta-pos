<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            // Inasoma kutoka kwenye meza ya sales (iliyotengenezwa hapo juu)
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            // Inasoma kutoka kwenye meza ya products
            $table->foreignId('product_id')->constrained('products');
            $table->integer('quantity');
            $table->decimal('price_at_sale', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};