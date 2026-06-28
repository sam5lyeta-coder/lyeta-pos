<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // Lazima yafanane na phpMyAdmin yako herufi kwa herufi
    protected $fillable = ['product_name', 'barcode', 'buying_price', 'selling_price', 'quantity', 'low_stock_threshold'];
}