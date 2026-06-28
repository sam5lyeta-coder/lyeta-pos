<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller {
    
    // 1. FUNCTION YA LOGIN YENYE ULINZI WA CASHIER
    public function login(Request $request) {
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        
        // Enforce @gmail.com
        if (!str_ends_with(strtolower($request->email), '@gmail.com')) {
            return response()->json(['status' => 'error', 'message' => 'Barua pepe lazima iishie na @gmail.com! / Email must end with @gmail.com!'], 422);
        }

        $user = User::where('email', $request->email)->first();
        
        // Kagua kama mtumiaji yupo na nenosiri lake liko sawa
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['status' => 'error', 'message' => 'Barua pepe au nenosiri si sahihi!'], 401);
        }

        // Kagua kama akaunti imeidhinishwa na Admin
        if ($user->status !== 'active') {
            return response()->json(['status' => 'error', 'message' => 'Akaunti yako inasubiri idhinisho kutoka kwa Admin. / Your account is pending Admin approval.'], 403);
        }

        // Kama 2FA ipo enabled (kwa admin au cashier aliyewasha)
        if ($user->two_factor_enabled) {
            $code = rand(100000, 999999);
            $user->two_factor_code = (string)$code;
            $user->two_factor_expires_at = now()->addMinutes(5);
            $user->save();

            try {
                \Illuminate\Support\Facades\Mail::raw("Nambari yako ya siri ya ulinzi (2FA Verification Code) kwa ajili ya kuingia kwenye mfumo wa LYETA CLASSIC ni: {$code}\n\nKumbuka: Nambari hii inaisha muda wake ndani ya dakika 5.", function($message) use ($user) {
                    $message->to($user->email)->subject("LYETA CLASSIC - 2FA Verification Code");
                });
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::info("2FA Code for {$user->email}: {$code}. Email failed to send: " . $e->getMessage());
            }

            return response()->json([
                'status' => '2fa_required',
                'message' => 'Nambari ya ulinzi ya 2FA imetumwa kwenye barua pepe yako (Gmail) au angalia logi ya mfumo.',
                'email' => $user->email,
                // Kwenye localhost, tunatuma pia msimbo huu moja kwa moja ili kurahisisha majaribio bila SMTP
                'dev_code' => config('app.env') === 'local' || config('database.connections.mysql.host') === '127.0.0.1' || config('database.connections.mysql.host') === 'localhost' ? $code : null
            ]);
        }

        // Tengeneza token ya kawaida kama 2FA haipo active
        $token = $user->createToken('auth_token')->plainTextToken;
        
        // Rekodi log ya mfumo
        \App\Http\Controllers\SalesController::log($user->id, $user->name, "Logged into the system", $request);
        
        return response()->json([
            'status' => 'success',
            'access_token' => $token,
            'user' => [
                'id' => $user->id, 
                'name' => $user->name, 
                'role' => $user->role,
                'status' => $user->status,
                'two_factor_enabled' => (bool)$user->two_factor_enabled
            ]
        ]);
    }

    // FUNCTION YA SIGNUP / REGISTER
    public function register(Request $request) {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|min:3'
        ]);

        // Enforce @gmail.com
        if (!str_ends_with(strtolower($request->email), '@gmail.com')) {
            return response()->json(['status' => 'error', 'message' => 'Barua pepe lazima iishie na @gmail.com! / Email must end with @gmail.com!'], 422);
        }

        if (User::where('email', $request->email)->exists()) {
            return response()->json(['status' => 'error', 'message' => 'Barua pepe hii tayari imesajiliwa! / This email is already registered!'], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'plain_password' => \Illuminate\Support\Facades\Crypt::encryptString($request->password),
            'role' => 'cashier',
            'status' => 'blocked' // pending admin approval
        ]);

        // Send registration email to the cashier's gmail address
        try {
            \Illuminate\Support\Facades\Mail::raw(
                "Hi {$user->name},\n\nYour registration on Sales Management System is complete and pending Admin approval. Please wait for the Admin to activate your account.\n\nBest regards,\nSales Management System",
                function ($message) use ($user) {
                    $message->to($user->email)
                            ->subject('Sales Management System - Registration Pending Approval');
                }
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send registration email: " . $e->getMessage());
        }

        return response()->json(['status' => 'success', 'message' => 'Usajili umekamilika. Kusubiri idhinisho la Admin! / Registration complete. Pending Admin approval!']);
    }

    // FUNCTION YA GOOGLE LOGIN (SIMULATED OAUTH)
    public function googleLogin(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'password' => 'required|string'
        ]);

        // Enforce @gmail.com
        if (!str_ends_with(strtolower($request->email), '@gmail.com')) {
            return response()->json(['status' => 'error', 'message' => 'Barua pepe ya Google lazima iishie na @gmail.com! / Google email must end with @gmail.com!'], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Register as cashier but pending admin approval
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'plain_password' => \Illuminate\Support\Facades\Crypt::encryptString($request->password),
                'role' => 'cashier',
                'status' => 'blocked'
            ]);

            // Send registration email to the cashier's gmail address
            try {
                \Illuminate\Support\Facades\Mail::raw(
                    "Hi {$user->name},\n\nYour Google sign-in registration on Sales Management System is complete and pending Admin approval. Please wait for the Admin to activate your account.\n\nBest regards,\nSales Management System",
                    function ($message) use ($user) {
                        $message->to($user->email)
                                ->subject('Sales Management System - Registration Pending Approval');
                    }
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to send Google registration email: " . $e->getMessage());
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Usajili wa Google umekamilika. Kusubiri idhinisho la Admin! / Google registration complete. Pending Admin approval!'
            ], 403);
        }

        // Validate password
        if (!Hash::check($request->password, $user->password) && $user->plain_password !== 'google_oauth') {
            return response()->json(['status' => 'error', 'message' => 'Nenosiri si sahihi! / Incorrect password!'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Akaunti yako inasubiri idhinisho kutoka kwa Admin. / Your account is pending Admin approval.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'access_token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'status' => $user->status
            ]
        ]);
    }

    public function getDeviceEmail() {
        $email = null;

        // 1. Try Windows Registry for Microsoft Account email
        if (strncasecmp(PHP_OS, 'WIN', 3) === 0) {
            try {
                $output = shell_exec('reg query HKEY_CURRENT_USER\Software\Microsoft\IdentityCRL\UserExtendedProperties 2>&1');
                if ($output) {
                    $lines = explode("\n", $output);
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if (empty($line)) continue;
                        $parts = explode('\\', $line);
                        $lastPart = end($parts);
                        if (filter_var($lastPart, FILTER_VALIDATE_EMAIL)) {
                            $email = $lastPart;
                            break;
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore registry errors
            }
        }

        // 2. Try Git global config email as fallback
        if (!$email) {
            try {
                $gitEmail = shell_exec('git config --global user.email 2>&1');
                $gitEmail = trim($gitEmail);
                if (filter_var($gitEmail, FILTER_VALIDATE_EMAIL)) {
                    $email = $gitEmail;
                }
            } catch (\Exception $e) {
                // Ignore git command errors
            }
        }

        // 3. Fallback to default
        if (!$email) {
            $email = 'sam5lyeta@gmail.com';
        }

        return response()->json(['email' => $email]);
    }

    public function getCashiers(Request $request) {
        // Tunavuta users wote ambao ni cashier tu
        $cashiers = User::where('role', 'cashier')->get(['id', 'name', 'email', 'status', 'role', 'plain_password']);
        foreach ($cashiers as $cashier) {
            if ($cashier->plain_password) {
                try {
                    $cashier->plain_password = \Illuminate\Support\Facades\Crypt::decryptString($cashier->plain_password);
                } catch (\Exception $e) {
                    // Fallback ikiwa ni ya zamani ambayo haikufungwa kwa Crypt
                }
            }
        }
        return response()->json($cashiers);
    }

    // 3. FUNCTION MPYA: KUBADILISHA STATUS YA CASHIER (PERMIT / BLOCK)
    public function toggleStatus(Request $request, $id) {
        $request->validate(['status' => 'required|string']);

        $user = User::find($id);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Cashier hajapatikana kwenye database'], 404);
        }

        $user->status = $request->status;
        $user->save();

        // Rekodi log ya mfumo
        \App\Http\Controllers\SalesController::log(null, null, "Changed status of cashier " . $user->name . " to " . strtoupper($user->status), $request);

        // Tuma barua pepe wakati akaunti inapokubaliwa
        if ($user->status === 'active') {
            try {
                \Illuminate\Support\Facades\Mail::raw(
                    "Hi {$user->name},\n\nYour account on Sales Management System has been approved by the Admin! You can now log in using your email ({$user->email}).\n\nBest regards,\nSales Management System",
                    function ($message) use ($user) {
                        $message->to($user->email)
                                ->subject('Sales Management System - Account Approved');
                    }
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to send approval email: " . $e->getMessage());
            }
        }

        return response()->json(['status' => 'success', 'message' => 'Ruhusa ya Cashier imebadilishwa kikamilifu!']);
    }

    // 4. FUNCTION MPYA: KUBADILI PASSWORD YA USER ALIYELOGIN (ADMIN AU CASHIER)
    public function changePassword(Request $request) {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'password' => 'required|min:3'
        ]);

        $user = User::findOrFail($request->user_id);
        $user->password = Hash::make($request->password);
        $user->plain_password = \Illuminate\Support\Facades\Crypt::encryptString($request->password);
        $user->save();

        // Rekodi log ya mfumo
        \App\Http\Controllers\SalesController::log($user->id, $user->name, "Reset own account password", $request);

        return response()->json(['status' => 'success', 'message' => 'Nenosiri limebadilishwa kikamilifu!']);
    }

    // 5. FUNCTION MPYA: KUBADILI PASSWORD YA CASHIER
    public function changeCashierPassword(Request $request, $id) {
        $request->validate([
            'password' => 'required|min:3'
        ]);

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->password);
        $user->plain_password = \Illuminate\Support\Facades\Crypt::encryptString($request->password);
        $user->save();

        // Rekodi log ya mfumo
        \App\Http\Controllers\SalesController::log(null, null, "Reset password for cashier " . $user->name, $request);

        // Send email alert to the cashier's gmail address
        try {
            \Illuminate\Support\Facades\Mail::raw(
                "Hi {$user->name},\n\nYour password on Sales Management System has been updated by the Admin. Your new password is: {$request->password}\n\nBest regards,\nSales Management System",
                function ($message) use ($user) {
                    $message->to($user->email)
                            ->subject('Sales Management System - Password Updated');
                }
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send password update email: " . $e->getMessage());
        }

        return response()->json(['status' => 'success', 'message' => 'Nenosiri la Cashier limesasishwa!']);
    }

    // 6. FUNCTION MPYA: KUFUTA CASHIER
    public function deleteCashier($id) {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Cashier hajapatikana!'], 404);
        }
        if ($user->role === 'admin') {
            return response()->json(['status' => 'error', 'message' => 'Huwezi kufuta akaunti ya Admin!'], 400);
        }
        // Rekodi log ya mfumo
        \App\Http\Controllers\SalesController::log(null, null, "Deleted cashier account: " . $user->name, request());

        $user->delete();
        return response()->json(['status' => 'success', 'message' => 'Cashier amefutwa kikamilifu!']);
    }

    // 7. FUNCTION MPYA: KUTHIBITISHA CODE YA 2FA WAKATI WA LOGIN
    public function verify2fa(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Mtumiaji hajapatikana!'], 404);
        }

        if (empty($user->two_factor_code) || empty($user->two_factor_expires_at) || now()->gt($user->two_factor_expires_at)) {
            return response()->json(['status' => 'error', 'message' => 'Nambari ya ulinzi imeisha muda wake au sio sahihi!'], 400);
        }

        if ($user->two_factor_code !== $request->code) {
            return response()->json(['status' => 'error', 'message' => 'Nambari ya ulinzi uliyoweka sio sahihi!'], 400);
        }

        // Safisha msimbo baada ya kuthibitisha
        $user->two_factor_code = null;
        $user->two_factor_expires_at = null;
        $user->save();

        // Tengeneza token ya ulinzi
        $token = $user->createToken('auth_token')->plainTextToken;
        \App\Http\Controllers\SalesController::log($user->id, $user->name, "Logged into the system via 2FA Verification", $request);

        return response()->json([
            'status' => 'success',
            'access_token' => $token,
            'user' => [
                'id' => $user->id, 
                'name' => $user->name, 
                'role' => $user->role,
                'status' => $user->status,
                'two_factor_enabled' => (bool)$user->two_factor_enabled
            ]
        ]);
    }

    // 8. FUNCTION MPYA: WASHA/ZIMA 2FA KUTOKA KWENYE SETTINGS
    public function toggle2fa(Request $request) {
        $token = $request->bearerToken();
        $user = null;
        if ($token) {
            $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($personalAccessToken) {
                $user = $personalAccessToken->tokenable;
            }
        }

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized Access'], 401);
        }

        $enabled = $request->input('enabled') ? 1 : 0;
        $user->two_factor_enabled = $enabled;
        $user->save();

        $actionMsg = $enabled ? "Enabled Two-Factor Authentication (2FA)" : "Disabled Two-Factor Authentication (2FA)";
        \App\Http\Controllers\SalesController::log($user->id, $user->name, $actionMsg, $request);

        return response()->json([
            'status' => 'success',
            'message' => $enabled ? 'Ulinzi wa 2FA umewashwa kikamilifu!' : 'Ulinzi wa 2FA umezimwa kikamilifu!',
            'two_factor_enabled' => (bool)$user->two_factor_enabled
        ]);
    }
}