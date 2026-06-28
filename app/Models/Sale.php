<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    // 🔒 Kulink Model na Jina halisi la table yako kule phpMyAdmin (sales)
    protected $table = 'sales';

    /**
     * Columns sahihi zitakazobeba data za Ankara (Invoice) na Ripoti za Mauzo live!
     * data hizi zitakuwa zinasomwa na React dashboard yako.
     */
    protected $fillable = [
        'user_id',
        'customer_id',
        'payment_method',
        'sale_date',
        'total_amount',
        'invoice_number',
        'cashier_name',
        'products_summary',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}