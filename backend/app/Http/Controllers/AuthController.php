<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'restaurantName' => ['required', 'string', 'min:2', 'max:80'],
            'ownerName' => ['required', 'string', 'min:2', 'max:60'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $restaurant = Restaurant::create([
                'name' => trim($validated['restaurantName']),
                'slug' => $this->uniqueSlug($validated['restaurantName']),
                'email' => strtolower(trim($validated['email'])),
                'is_active' => true,
            ]);

            $user = User::create([
                'restaurant_id' => $restaurant->id,
                'name' => trim($validated['ownerName']),
                'email' => strtolower(trim($validated['email'])),
                'password' => $validated['password'],
                'role' => 'owner',
            ]);

            return compact('user', 'restaurant');
        });

        $token = $result['user']->createToken('menupilot-web')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => $result['user'],
                'restaurant' => $result['restaurant'],
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('restaurant')->where('email', strtolower(trim($validated['email'])))->first();

        if ($user?->locked_until && now()->lt($user->locked_until)) {
            return response()->json(['message' => 'Account temporarily locked.'], 423);
        }

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            if ($user) {
                $user->increment('login_attempts');
                $user->refresh();
                if ($user->login_attempts >= 5) {
                    $user->update([
                        'locked_until' => now()->addMinutes(15),
                        'login_attempts' => 0,
                    ]);
                    return response()->json(['message' => 'Account temporarily locked.'], 423);
                }
            }
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->restaurant || !$user->restaurant->is_active) {
            return response()->json(['message' => 'Restaurant account is inactive.'], 403);
        }

        $user->update(['login_attempts' => 0, 'locked_until' => null]);
        $user->tokens()->delete();
        $token = $user->createToken('menupilot-web')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => $user,
                'restaurant' => $user->restaurant,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('restaurant');

        return response()->json([
            'data' => [
                'user' => $user,
                'restaurant' => $user->restaurant,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['data' => ['message' => 'Logged out successfully.']]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'restaurant';
        $slug = $base;
        $counter = 2;
        while (Restaurant::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter++;
        }
        return $slug;
    }
}
