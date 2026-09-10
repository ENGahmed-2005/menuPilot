<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::updateOrCreate(
            ['slug' => 'demo-restaurant'],
            [
                'name' => 'Demo Restaurant',
                'phone' => '+970000000000',
                'email' => 'owner@menupilot.app',
                'address' => 'Demo address',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'owner@menupilot.app'],
            [
                'restaurant_id' => $restaurant->id,
                'name' => 'Demo Owner',
                'password' => 'password123',
                'role' => 'owner',
                'login_attempts' => 0,
                'locked_until' => null,
            ]
        );
    }
}
