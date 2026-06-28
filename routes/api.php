<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CashierController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\Api\CustomerController;

// 1. NJIA ZA AUTHENTICATION NA CASHIER MANAGEMENT
Route::post('/login', [AuthController::class, 'login']);                      // <-- Njia ya Login
Route::post('/register', [AuthController::class, 'register']);                // <-- Njia ya Signup
Route::post('/google-login', [AuthController::class, 'googleLogin']);          // <-- Njia ya Google Sign-in
Route::get('/device-email', [AuthController::class, 'getDeviceEmail']);          // <-- Njia ya ku-detect email ya kifaa/device
Route::get('/users', [AuthController::class, 'getCashiers']);                 // <-- Njia ya kuvuta Cashiers
Route::post('/users/{id}/toggle-status', [AuthController::class, 'toggleStatus']); // <-- Njia ya ku-Block/Permit
Route::post('/change-password', [AuthController::class, 'changePassword']);   // <-- Njia ya kubadili password ya mtumiaji aliyelogin
Route::post('/users/{id}/change-password', [AuthController::class, 'changeCashierPassword']); // <-- Njia ya admin kubadili password ya cashier
Route::delete('/users/{id}', [AuthController::class, 'deleteCashier']);        // <-- Njia ya kufuta cashier

// NJIA ZA CUSTOMERS (CRM)
Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::get('/customers/{id}/history', [CustomerController::class, 'history']);

// 2. NJIA ZA BIDHAA (PRODUCTS)
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::post('/products/{id}/update-stock', [ProductController::class, 'updateStock']); // <-- ONGEZA STOKI MPYA KUTOKA REACT
Route::delete('/products/{id}', [ProductController::class, 'destroy']);                // <-- FUTA BIDHAA KWENYE DB
Route::post('/products/import-excel', [ProductController::class, 'importExcel']);      // <-- IMPORT EXCEL UNLIMITED

// 3. NJIA ZA MAUZO (SALES)
Route::get('/sales', [SalesController::class, 'index']);
Route::post('/sales', [CashierController::class, 'processSale']);

// 4. ACTIVITY LOGS
Route::post('/log-activity', [SalesController::class, 'logActivityPost']);
Route::get('/activity-logs', [SalesController::class, 'getActivityLogs']);

// 5. DATABASE BACKUP
Route::post('/backup', [SalesController::class, 'backupDatabase']);

// 6. TWO-FACTOR AUTHENTICATION (2FA)
Route::post('/verify-2fa', [AuthController::class, 'verify2fa']);
Route::post('/toggle-2fa', [AuthController::class, 'toggle2fa']);