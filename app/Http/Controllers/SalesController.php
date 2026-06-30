<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;

class SalesController extends Controller
{
    /**
     * PROGRESS REPORT STATION:
     * Inakusanya data zote za Stock In, Stock Out, na Mauzo kwa siku, wiki, na mwezi
     */
    public function index()
    {
        try {
            // Today range
            $today = now()->toDateString();
            
            // Current Week range (Monday to Sunday)
            $startOfWeek = now()->startOfWeek()->toDateString();
            $endOfWeek = now()->endOfWeek()->toDateString();
            
            // Current Month
            $startOfMonth = now()->startOfMonth()->toDateString();
            $endOfMonth = now()->endOfMonth()->toDateString();

            // 1. Calculations for Today (Real Sales and Profit)
            $todaySales = DB::table('sales')
                ->where('sale_date', $today)
                ->sum('total_amount');
            
            $todayCost = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sales.sale_date', $today)
                ->sum(DB::raw('products.buying_price * sale_items.quantity'));
            $todayProfit = $todaySales - $todayCost;

            // 2. Calculations for Weekly (Real Sales and Profit)
            $weeklySales = DB::table('sales')
                ->whereBetween('sale_date', [$startOfWeek, $endOfWeek])
                ->sum('total_amount');

            $weeklyCost = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->whereBetween('sales.sale_date', [$startOfWeek, $endOfWeek])
                ->sum(DB::raw('products.buying_price * sale_items.quantity'));
            $weeklyProfit = $weeklySales - $weeklyCost;

            // 3. Calculations for Monthly (Real Sales and Profit)
            $monthlySales = DB::table('sales')
                ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
                ->sum('total_amount');

            $monthlyCost = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->whereBetween('sales.sale_date', [$startOfMonth, $endOfMonth])
                ->sum(DB::raw('products.buying_price * sale_items.quantity'));
            $monthlyProfit = $monthlySales - $monthlyCost;

            // 4. MAZALISHO YA RIPOTI YA STOKI (STOCK IN, STOCK OUT, REAL STOCK) FOR THIS WEEK
            $products = Product::all();
            $stockReport = []; // Group A: Bidhaa zisizofanyiwa restock na zisizo na low alerts
            $stockUpdatesList = []; // Group B: Bidhaa zilizofanyiwa restocks wiki hii

            // Kupata restocks zote za wiki hii zikiwa zimepangwa kwa tarehe (ascending)
            $weeklyUpdates = DB::table('stock_updates')
                ->whereBetween('created_at', [$startOfWeek . ' 00:00:00', $endOfWeek . ' 23:59:59'])
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($products as $product) {
                // Inatafuta jumla ya bidhaa zilizotoka/zilizouzwa wiki hii kutoka meza ya sale_items
                $stockOut = DB::table('sale_items')
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->where('sale_items.product_id', $product->id)
                    ->whereBetween('sales.sale_date', [$startOfWeek, $endOfWeek])
                    ->sum('sale_items.quantity');

                $productUpdates = $weeklyUpdates->where('product_id', $product->id);
                $totalAdded = $productUpdates->sum('added_stock');

                // Mzigo wa mwanzo wa wiki (kabla ya nyongeza au mauzo yoyote)
                $initialStock = $product->quantity + $stockOut - $totalAdded;
                if ($initialStock < 0) {
                    $initialStock = 0;
                }

                if ($productUpdates->count() > 0) {
                    // Group B: Bidhaa zilizo na restocks wiki hii (zinahesabiwa kwa mzunguko wa interval)
                    $previousStock = $initialStock;
                    foreach ($productUpdates as $update) {
                        $oldStock = (int)$update->old_stock;
                        $addedStock = (int)$update->added_stock;
                        $newStock = (int)$update->new_stock;

                        // Ikiwa kuna upishano wa stoo kabla ya hapo, weka old_stock kama msingi
                        if ($oldStock > $previousStock) {
                            $previousStock = $oldStock;
                        }

                        $intervalStockOut = $previousStock - $oldStock;

                        $startDate = \Carbon\Carbon::parse($startOfWeek);
                        $updateDate = \Carbon\Carbon::parse($update->created_at);
                        $diffInDays = $startDate->diffInDays($updateDate) + 1;
                        if ($diffInDays < 1) $diffInDays = 1;
                        if ($diffInDays > 7) $diffInDays = 7;

                        $stockUpdatesList[] = [
                            'id'            => $update->id,
                            'product_name'  => $update->product_name,
                            'cycle_day'     => $diffInDays,
                            'date'          => $updateDate->toDateString(),
                            'initial_stock' => $previousStock,
                            'stock_out'     => $intervalStockOut,
                            'remain_stock'  => $oldStock,
                            'added_stock'   => $addedStock,
                            'real_stock'    => $newStock
                        ];

                        $previousStock = $newStock;
                    }
                } else {
                    // Group A: Bidhaa zisizofanyiwa restock na zisizo na low alerts
                    $stockReport[] = [
                        'id'           => $product->id,
                        'product_name' => $product->product_name,
                        'stock_in'     => (int)$initialStock,
                        'stock_out'    => (int)$stockOut,
                        'real_stock'   => (int)$product->quantity
                    ];
                }
            }

            // 5. LIST OF SALES LOG (FOR CHARTS AND LIVE FEED)
            $salesLog = DB::table('sales')
                ->leftJoin('users', 'sales.user_id', '=', 'users.id')
                ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
                ->select(
                    'sales.id',
                    'sales.total_amount',
                    'sales.sale_date',
                    'sales.created_at',
                    'sales.payment_method',
                    'users.name as cashier_name',
                    'customers.name as customer_name',
                    'customers.phone as customer_phone'
                )
                ->orderBy('sales.id', 'desc')
                ->get()
                ->map(function ($sale) {
                    $productsList = DB::table('sale_items')
                        ->join('products', 'sale_items.product_id', '=', 'products.id')
                        ->where('sale_items.sale_id', $sale->id)
                        ->pluck('products.product_name')
                        ->toArray();

                    $productNames = implode(', ', $productsList);
                    if (empty($productNames)) {
                        $productNames = 'Stock Transaction';
                    }

                    $saleProfit = DB::table('sale_items')
                        ->join('products', 'sale_items.product_id', '=', 'products.id')
                        ->where('sale_items.sale_id', $sale->id)
                        ->sum(DB::raw('(sale_items.price_at_sale - products.buying_price) * sale_items.quantity'));

                    return [
                        'id' => $sale->id,
                        'total_amount' => (float)$sale->total_amount,
                        'profit' => (float)$saleProfit,
                        'sale_date' => $sale->sale_date,
                        'time' => $sale->created_at ? now()->parse($sale->created_at)->format('g:i A') : 'N/A',
                        'cashier_name' => $sale->cashier_name ?? 'System',
                        'customer_name' => $sale->customer_name ?? 'N/A',
                        'customer_phone' => $sale->customer_phone ?? 'N/A',
                        'product_name' => $productNames,
                        'payment_method' => $sale->payment_method
                    ];
                });

            // 6. TOP SELLING PRODUCTS FOR ADMIN (TOP 5 MOST SOLD)
            $topSelling = DB::table('sale_items')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->select('products.product_name', DB::raw('SUM(sale_items.quantity) as total_sold'))
                ->groupBy('products.id', 'products.product_name')
                ->orderByDesc('total_sold')
                ->limit(5)
                ->get();

            // 7. SLOW SELLING PRODUCTS (TOP 5 LEAST SOLD)
            $slowSelling = DB::table('products')
                ->leftJoin('sale_items', 'products.id', '=', 'sale_items.product_id')
                ->select('products.product_name', DB::raw('COALESCE(SUM(sale_items.quantity), 0) as total_sold'))
                ->groupBy('products.id', 'products.product_name')
                ->orderBy('total_sold', 'asc')
                ->limit(5)
                ->get();

            // Inatuma data zote safi kwenda React kwa mpigo mmoja
            return response()->json([
                'status' => 'success',
                'sales_summary' => [
                    'today'          => (float)$todaySales,
                    'today_profit'   => (float)$todayProfit,
                    'weekly'         => (float)$weeklySales,
                    'weekly_profit'  => (float)$weeklyProfit,
                    'monthly'        => (float)$monthlySales,
                    'monthly_profit' => (float)$monthlyProfit
                ],
                'stock_report' => $stockReport,
                'stock_updates' => $stockUpdatesList,
                'sales_log'    => $salesLog,
                'top_selling'  => $topSelling,
                'slow_selling' => $slowSelling
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Imeshindwa kuandaa ripoti ya maendeleo ya biashara: ' . $e->getMessage()
            ], 500);
        }
    }

    public static function log($userId, $cashierName, $action, $request) {
        $userAgent = $request->header('User-Agent');
        $ip = $request->ip();
        if ($ip === '::1' || $ip === '127.0.0.1') {
            $ip = 'Localhost (Server ya Duka)';
        }
        
        if (empty($userId) || empty($cashierName)) {
            $token = $request->bearerToken();
            if ($token) {
                $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($personalAccessToken) {
                    $user = $personalAccessToken->tokenable;
                    if ($user) {
                        $userId = $user->id;
                        $cashierName = $user->name;
                    }
                }
            }
        }
        
        $os = 'Unknown OS';
        if (preg_match('/windows|win32/i', $userAgent)) $os = 'Windows PC';
        elseif (preg_match('/macintosh|mac os x/i', $userAgent)) $os = 'Macintosh';
        elseif (preg_match('/android/i', $userAgent)) $os = 'Android';
        elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) $os = 'iOS Device';
        elseif (preg_match('/linux/i', $userAgent)) $os = 'Linux';

        $browser = 'Unknown Browser';
        if (preg_match('/chrome/i', $userAgent)) $browser = 'Chrome';
        elseif (preg_match('/safari/i', $userAgent)) $browser = 'Safari';
        elseif (preg_match('/firefox/i', $userAgent)) $browser = 'Firefox';
        elseif (preg_match('/edge/i', $userAgent)) $browser = 'Edge';
        
        $device = "$os ($browser)";

        DB::table('activity_logs')->insert([
            'user_id' => $userId,
            'cashier_name' => $cashierName ?? 'System',
            'action' => $action,
            'device' => $device,
            'ip_address' => $ip,
            'created_at' => now()
        ]);
    }

    public function logActivityPost(Request $request) {
        try {
            $userId = $request->input('user_id');
            $cashierName = $request->input('cashier_name');
            $action = $request->input('action');

            if (empty($action)) {
                return response()->json(['status' => 'error', 'message' => 'Action payload required'], 400);
            }

            self::log($userId, $cashierName, $action, $request);

            return response()->json(['status' => 'success'], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function getActivityLogs() {
        try {
            // Futa logs zilizozidi mwezi mmoja (siku 30) ili kuongeza utendaji wa mfumo (Performance)
            DB::table('activity_logs')->where('created_at', '<', now()->subDays(30))->delete();

            $logs = DB::table('activity_logs')
                ->orderBy('id', 'desc')
                ->limit(100)
                ->get()
                ->map(function($log) {
                    return [
                        'id' => $log->id,
                        'user_id' => $log->user_id,
                        'cashier_name' => $log->cashier_name,
                        'action' => $log->action,
                        'device' => $log->device,
                        'ip_address' => $log->ip_address,
                        'created_at' => now()->parse($log->created_at)->format('Y-m-d g:i A')
                    ];
                });

            return response()->json([
                'status' => 'success',
                'activity_logs' => $logs
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function backupDatabase(Request $request) {
        try {
            $token = $request->bearerToken();
            $admin = null;
            if ($token) {
                $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($personalAccessToken) {
                    $admin = $personalAccessToken->tokenable;
                }
            }
            
            if (!$admin || $admin->role !== 'admin') {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized Access. Admin permission required.'], 401);
            }

            // Get database name from configuration
            $dbName = config('database.connections.mysql.database');
            $tables = DB::select('SHOW TABLES');
            $key = 'Tables_in_' . $dbName;
            
            $sqlDump = "-- LYETA CLASSIC DATABASE BACKUP\n";
            $sqlDump .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
            $sqlDump .= "-- Admin: " . $admin->name . "\n\n";
            $sqlDump .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

            foreach ($tables as $table) {
                $tableName = $table->$key;
                
                // Table Structure
                $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
                $sqlDump .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sqlDump .= $createTable[0]->{'Create Table'} . ";\n\n";
                
                // Table Data
                $rows = DB::table($tableName)->get();
                foreach ($rows as $row) {
                    $rowArray = (array)$row;
                    $columns = array_keys($rowArray);
                    $escapedValues = array_map(function($val) {
                        if (is_null($val)) return 'NULL';
                        return "'" . addslashes($val) . "'";
                    }, array_values($rowArray));
                    
                    $sqlDump .= "INSERT INTO `{$tableName}` (`" . implode("`, `", $columns) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
                }
                $sqlDump .= "\n";
            }
            
            $sqlDump .= "SET FOREIGN_KEY_CHECKS=1;\n";
            
            $fileName = 'backup_' . date('Y_m_d_His') . '.sql';
            
            // Log this action
            self::log($admin->id, $admin->name, "Performed full system database backup", $request);
            
            return response($sqlDump)
                ->header('Content-Type', 'application/sql')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
                
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Backup failed: ' . $e->getMessage()], 500);
        }
    }
}