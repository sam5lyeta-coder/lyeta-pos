<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\AuditLog;
use Exception;

class CashierController extends Controller
{
    // 1. Kuvuta data za bidhaa zote kwa haraka kwenye POS Terminal ya Cashier
    public function getProducts() {
        $products = Product::select('id', 'product_name', 'barcode', 'selling_price', 'quantity')->get();
        return response()->json($products);
    }

    // 2. Kuchakata Mauzo na Kuzuia Ujanja/Wizi kwa kutumia Database Transactions
    public function processSale(Request $request) {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|in:cash,m-pesa,tigo-pesa,airtel-money,bank',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $totalAmount = 0;
        $itemsToProcess = [];

        DB::beginTransaction(); // Inafunga meza zote; kosa likitokea hakuna kinachohifadhiwa

        try {
            foreach ($request->items as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);

                // Kama stoki haitoshi, mfumo unakataa muamala hapo hapo
                if ($product->quantity < $item['quantity']) {
                    throw new Exception("Stock is not enough for product: " . $product->product_name);
                }

                $itemTotal = $product->selling_price * $item['quantity'];
                $totalAmount += $itemTotal;

                $itemsToProcess[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->product_name,
                    'quantity' => $item['quantity'],
                    'selling_price' => $product->selling_price,
                    'old_stock' => $product->quantity
                ];

                // KIPENGELE CHA MSINGI: Kupunguza idadi ya bidhaa kiotomatiki
                $product->quantity -= $item['quantity'];
                $product->save();
            }

            // Kuunda Risiti Kuu
            $sale = Sale::create([
                'user_id' => $request->user_id,
                'customer_id' => $request->customer_id,
                'total_amount' => $totalAmount,
                'payment_method' => $request->payment_method,
                'sale_date' => now()->toDateString(),
            ]);

            // Kuhifadhi kila bidhaa iliyouzwa
            foreach ($itemsToProcess as $pItem) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $pItem['product_id'],
                    'quantity' => $pItem['quantity'],
                    'price_at_sale' => $pItem['selling_price'],
                ]);

                // EXTRA FEATURE 1: Audit Logs (Kuweka kumbukumbu thabiti ya mabadiliko ya stoki)
                AuditLog::create([
                    'user_id' => $request->user_id,
                    'action' => 'Sale Processed',
                    'description' => "Cashier ID {$request->user_id} sold {$pItem['quantity']} of {$pItem['product_name']}. Stock modified from {$pItem['old_stock']} to {$product->quantity}.",
                    'ip_address' => $request->ip()
                ]);
            }

            DB::commit(); // Inahifadhi mabadiliko yote kwenye MySQL sasa
            
            // Rekodi log ya mfumo
            $cashierUser = \App\Models\User::find($request->user_id);
            $cashierName = $cashierUser ? $cashierUser->name : 'Cashier ID ' . $request->user_id;
            \App\Http\Controllers\SalesController::log($request->user_id, $cashierName, "Completed sale checkout #" . $sale->id . " (Total: TSH " . number_format($totalAmount) . " via " . strtoupper($request->payment_method) . ")", $request);

            $customer = null;
            if ($sale->customer_id) {
                $customerModel = \App\Models\Customer::find($sale->customer_id);
                if ($customerModel) {
                    $customer = [
                        'name' => $customerModel->name,
                        'phone' => $customerModel->phone ?? 'N/A'
                    ];
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Sale processed and stock updated successfully!',
                'sale_id' => $sale->id,
                'total' => $totalAmount,
                'customer' => $customer
            ], 201);

        } catch (Exception $e) {
            DB::rollBack(); // Inafuta kila kitu muamala ukifeli au stoki ikikataa
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 400);
        }
    }
}