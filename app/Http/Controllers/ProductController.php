<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    // 1. VUTA BIDHAA ZOTE KUTOKA KWENYE DATABASE
    public function index()
    {
        try {
            // Inavuta bidhaa zote na kuzipanga kuanzia ya mwisho kuingizwa (Latest first)
            $products = Product::orderBy('id', 'desc')->get();
            return response()->json($products, 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Imeshindwa kuvuta bidhaa: ' . $e->getMessage()
            ], 500);
        }
    }

    // 2. POKEA NA KUHIFADHI BIDHAA MPYA LIVE KWENYE DATABASE (PHPMYADMIN)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'buying_price' => 'required|numeric',
            'selling_price' => 'required|numeric',
            'stock' => 'required|integer',
            'barcode' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tafadhali kagua fomu yako.',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->buying_price >= $request->selling_price) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bei ya Kuuzia lazima iwe kubwa kuliko Bei ya Kununulia (Capital)!'
            ], 422);
        }

        try {
            // Inasajili bidhaa kulingana na columns halisi za database yako ya phpMyAdmin
            $product = Product::create([
                'product_name'        => $request->name,
                'barcode'             => $request->barcode,
                'buying_price'        => $request->buying_price,
                'selling_price'       => $request->selling_price,
                'quantity'            => $request->stock,
                'low_stock_threshold' => 5 // Thamani ya kuanzia kutoa taarifa mzigo ukiisha
            ]);

            // Rekodi log ya mfumo
            \App\Http\Controllers\SalesController::log(null, null, "Created new product: " . $product->product_name . " (Price: TSH " . number_format($product->selling_price) . ", Stock: " . $product->quantity . ")", $request);

            return response()->json([
                'status' => 'success',
                'product' => $product
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Imeshindwa kusave bidhaa kwenye Database: ' . $e->getMessage()
            ], 500);
        }
    }

    // 3. SASISHA/UPDATE STOKI MPYA (ADMIN ANAONGEZA MZIGO MPYA STOO)
    public function updateStock(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Idadi ya stoki lazima iwe namba kamili.'
            ], 422);
        }

        try {
            $product = Product::find($id);
            if (!$product) {
                return response()->json(['status' => 'error', 'message' => 'Bidhaa haijapatikana!'], 404);
            }

            $oldStock = $product->quantity;
            $newStock = $request->quantity;
            $addedStock = $newStock - $oldStock;

            // Inasave jumla mpya ya stoki iliyoongezwa na Admin kule React prompt
            $product->quantity = $newStock;
            $product->save();

            // Rekodi kwenye stock_updates
            \Illuminate\Support\Facades\DB::table('stock_updates')->insert([
                'product_id' => $product->id,
                'product_name' => $product->product_name,
                'old_stock' => $oldStock,
                'added_stock' => $addedStock,
                'new_stock' => $newStock,
                'created_at' => now()
            ]);

            // Rekodi log ya mfumo
            \App\Http\Controllers\SalesController::log(null, null, "Updated stock for product " . $product->product_name . " to " . $product->quantity . " Pcs", $request);

            return response()->json([
                'status' => 'success',
                'message' => 'Stoki imesasishwa vizuri kwenye database!'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Imeshindwa kusasisha stoki: ' . $e->getMessage()
            ], 500);
        }
    }

    // 4. FUTA BIDHAA KABISA KWENYE DATABASE (DELETE)
    public function destroy($id)
    {
        try {
            $product = Product::find($id);
            if (!$product) {
                return response()->json(['status' => 'error', 'message' => 'Bidhaa haijapatikana!'], 404);
            }

            // Rekodi log ya mfumo
            \App\Http\Controllers\SalesController::log(null, null, "Deleted product: " . $product->product_name, $request);

            $product->delete();
            return response()->json([
                'status' => 'success',
                'message' => 'Bidhaa imefutwa kabisa kwenye database!'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Imeshindwa kufuta bidhaa: ' . $e->getMessage()
            ], 500);
        }
    }

    // 5. IMPORT EXCEL/CSV DATA
    public function importExcel(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tafadhali chagua faili la CSV.'
            ], 400);
        }

        $file = $request->file('file');
        
        $extension = $file->getClientOriginalExtension();
        if (strtolower($extension) !== 'csv') {
            return response()->json([
                'status' => 'error',
                'message' => 'Faili lazima liwe la aina ya CSV (.csv).'
            ], 400);
        }

        try {
            $path = $file->getRealPath();
            $productsToSave = [];
            
            if (($handle = fopen($path, 'r')) !== FALSE) {
                // Get header row
                $header = fgetcsv($handle, 1000, ',');
                
                $colIndices = [
                    'name' => -1,
                    'buying_price' => -1,
                    'selling_price' => -1,
                    'stock' => -1
                ];

                if ($header) {
                    foreach ($header as $index => $colName) {
                        $colNameClean = strtolower(trim($colName));
                        if (str_contains($colNameClean, 'name') || str_contains($colNameClean, 'bidhaa') || str_contains($colNameClean, 'jina') || str_contains($colNameClean, 'product')) {
                            $colIndices['name'] = $index;
                        } elseif (str_contains($colNameClean, 'buying') || str_contains($colNameClean, 'kununua') || str_contains($colNameClean, 'capital') || str_contains($colNameClean, 'buying price')) {
                            $colIndices['buying_price'] = $index;
                        } elseif (str_contains($colNameClean, 'selling') || str_contains($colNameClean, 'kuuza') || str_contains($colNameClean, 'selling price')) {
                            $colIndices['selling_price'] = $index;
                        } elseif (str_contains($colNameClean, 'stock') || str_contains($colNameClean, 'idadi') || str_contains($colNameClean, 'quantity') || str_contains($colNameClean, 'initial')) {
                            $colIndices['stock'] = $index;
                        }
                    }
                }

                if ($colIndices['name'] == -1) $colIndices['name'] = 0;
                if ($colIndices['buying_price'] == -1) $colIndices['buying_price'] = 1;
                if ($colIndices['selling_price'] == -1) $colIndices['selling_price'] = 2;
                if ($colIndices['stock'] == -1) $colIndices['stock'] = 3;

                $rowNumber = 1;
                while (($row = fgetcsv($handle, 1000, ',')) !== FALSE) {
                    $rowNumber++;
                    if (count($row) < 2 || empty(trim($row[0] ?? ''))) {
                        continue;
                    }

                    $name = trim($row[$colIndices['name']] ?? '');
                    $buyingPrice = floatval(trim($row[$colIndices['buying_price']] ?? 0));
                    $sellingPrice = floatval(trim($row[$colIndices['selling_price']] ?? 0));
                    $stock = intval(trim($row[$colIndices['stock']] ?? 0));

                    if (empty($name)) {
                        continue;
                    }

                    // Validation: selling price must be greater than buying price
                    if ($buyingPrice >= $sellingPrice) {
                        fclose($handle);
                        return response()->json([
                            'status' => 'error',
                            'message' => "Kwenye Mstari wa {$rowNumber}: Bidhaa '{$name}' ina Bei ya Kununulia (TSH " . number_format($buyingPrice) . ") ambayo ni kubwa au sawa na Bei ya Kuuzia (TSH " . number_format($sellingPrice) . "). Bei ya Kuuzia lazima iwe kubwa kuliko ya Kununulia!"
                        ], 422);
                    }

                    $productsToSave[] = [
                        'product_name' => $name,
                        'buying_price' => $buyingPrice,
                        'selling_price' => $sellingPrice,
                        'quantity' => $stock
                    ];
                }
                fclose($handle);
            }

            if (empty($productsToSave)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Hakuna data yoyote iliyopatikana kwenye faili.'
                ], 400);
            }

            // Save products to database
            foreach ($productsToSave as $pData) {
                $existing = Product::where('product_name', $pData['product_name'])->first();
                if ($existing) {
                    $existing->buying_price = $pData['buying_price'];
                    $existing->selling_price = $pData['selling_price'];
                    $existing->quantity += $pData['quantity']; // Add to existing stock
                    $existing->save();
                } else {
                    $barcode = 'BC-' . rand(10000000, 99999999);
                    while (Product::where('barcode', $barcode)->exists()) {
                        $barcode = 'BC-' . rand(10000000, 99999999);
                    }

                    Product::create([
                        'product_name' => $pData['product_name'],
                        'barcode' => $barcode,
                        'buying_price' => $pData['buying_price'],
                        'selling_price' => $pData['selling_price'],
                        'quantity' => $pData['quantity'],
                        'low_stock_threshold' => 5
                    ]);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Bidhaa zote zimeingizwa kwenye database salama!'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Hitilafu ilitokea wakati wa kusoma faili: ' . $e->getMessage()
            ], 500);
        }
    }
}