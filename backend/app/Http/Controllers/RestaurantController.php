<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['data' => $request->user()->load('restaurant')->restaurant]);
    }

    public function update(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        abort_unless($restaurant, 404, 'Restaurant not found.');

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:80'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'logo_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $restaurant->update($validated);

        return response()->json(['data' => $restaurant->fresh()]);
    }
}
