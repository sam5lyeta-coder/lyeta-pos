<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash};
use App\Models\{Product, Sale, AuditLog, User};

class AdminController extends Controller
{
    /**
     * Get Admin Dashboard Data
     */
    public function getAdminDashboard()
    {
        $today = now();
        
        $sevenDaysSales = Sale::where('sale_date', '>=', $today->subDays(7)->toDateString())
            ->orderBy('sale_date', 'asc')
            ->get(['sale_date', 'total_amount']);

        $thisWeek = Sale::whereBetween('sale_date', [$today->startOfWeek()->toDateString(), $today->endOfWeek()->toDateString()])->sum('total_amount');
        $lastWeek = Sale::whereBetween('sale_date', [$today->subWeek()->startOfWeek()->toDateString(), $today->subWeek()->endOfWeek()->toDateString()])->sum('total_amount');

        $growth = $lastWeek > 0 ? (($thisWeek - $lastWeek) / $lastWeek) * 100 : ($thisWeek > 0 ? 100 : 0);

        return response()->json([
            'total_revenue_7_days' => $sevenDaysSales->sum('total_amount'),
            'weekly_percentage_growth' => round($growth, 2) . '%',
            'this_week_total' => $thisWeek,
            'inventory_status' => Product::select('product_name', 'quantity', 'low_stock_threshold')->get(),
            'low_stock_alerts' => Product::whereRaw('quantity <= low_stock_threshold')->get(['product_name', 'quantity']),
            'audit_logs' => AuditLog::with('user')->orderBy('id', 'desc')->take(10)->get()
        ]);
    }

    /**
     * Admin: Change Password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Password ya sasa si sahihi!'], 400);
        }

        $request->user()->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Password imebadilishwa kikamilifu.']);
    }

    /**
     * Admin: Change System Theme Color
     */
    public function updateTheme(Request $request)
    {
        $request->validate([
            'theme_color' => 'required|string|regex:/^#[a-zA-Z0-9]{6}$/',
        ]);

        $request->user()->update([
            'theme_color' => $request->theme_color
        ]);

        return response()->json([
            'message' => 'Theme imebadilishwa.',
            'new_color' => $request->theme_color
        ]);
    }
}