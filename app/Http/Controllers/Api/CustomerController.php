<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    // 1. Orodha ya wateja wote na kiwango cha manunuzi yao
    public function index()
    {
        try {
            // Futa wateja waliosajiliwa zaidi ya siku 30 zilizopita (1 month)
            Customer::where('created_at', '<', now()->subDays(30))->delete();

            $customers = Customer::orderBy('name', 'asc')->get();
            $data = [];

            foreach ($customers as $customer) {
                // Mahesabu ya jumla ya manunuzi ya mteja huyu
                $totalSpent = DB::table('sales')
                    ->where('customer_id', $customer->id)
                    ->sum('total_amount');

                $data[] = [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone ?? 'N/A',
                    'total_spent' => (float)$totalSpent,
                    'created_at' => $customer->created_at ? $customer->created_at->toDateString() : 'N/A'
                ];
            }

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // 2. Kusajili mteja mpya
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20'
        ]);

        if ($request->phone) {
            $phone = trim($request->phone);
            if (strlen($phone) < 9 || strlen($phone) > 15) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Namba ya simu lazima iwe na urefu kati ya tarakimu 9 hadi 15. / Phone number must be between 9 and 15 characters.'
                ], 422);
            }
        }

        try {
            // Kuzuia usajili wa namba ileile kama imetolewa
            if ($request->phone) {
                $exists = Customer::where('phone', $request->phone)->first();
                if ($exists) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Namba hii ya simu tayari imesajiliwa kwa mteja: ' . $exists->name
                    ], 422);
                }
            }

            $customer = Customer::create([
                'name' => $request->name,
                'phone' => $request->phone
            ]);

            // Rekodi log ya mfumo
            \App\Http\Controllers\SalesController::log(null, null, "Registered new customer: " . $customer->name, $request);

            return response()->json([
                'status' => 'success',
                'message' => 'Mteja amesajiliwa kikamilifu!',
                'customer' => $customer
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // 3. Historia ya manunuzi ya mteja
    public function history($id)
    {
        try {
            $customer = Customer::find($id);
            if (!$customer) {
                return response()->json(['status' => 'error', 'message' => 'Mteja hajapatikana!'], 404);
            }

            // Tafuta mauzo yote ya mteja huyu
            $sales = Sale::where('customer_id', $customer->id)
                ->orderBy('id', 'desc')
                ->get()
                ->map(function ($sale) {
                    // Kupata bidhaa zilizouzwa kwenye risiti hii
                    $items = DB::table('sale_items')
                        ->join('products', 'sale_items.product_id', '=', 'products.id')
                        ->where('sale_items.sale_id', $sale->id)
                        ->select('products.product_name', 'sale_items.quantity', 'sale_items.price_at_sale')
                        ->get();

                    return [
                        'id' => $sale->id,
                        'total_amount' => (float)$sale->total_amount,
                        'payment_method' => $sale->payment_method,
                        'sale_date' => $sale->sale_date,
                        'time' => $sale->created_at ? $sale->created_at->format('g:i A') : 'N/A',
                        'items' => $items
                    ];
                });

            return response()->json([
                'status' => 'success',
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone ?? 'N/A'
                ],
                'sales' => $sales
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
