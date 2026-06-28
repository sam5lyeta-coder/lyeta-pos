<?php

use Illuminate\Support\Facades\Route;

// Ukurasa mkuu wa Login (Ule wa sasa hivi)
Route::get('/', function () {
    return view('welcome');
});

// Kurasa za Ndani tulizozilenga kwenye React zote zielekeze kwenye welcome view ili React Router isome
Route::get('/admin/dashboard', function () {
    return view('welcome');
});

Route::get('/cashier/dashboard', function () {
    return view('welcome');
});