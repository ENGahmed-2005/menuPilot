<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('about-menupilot', function () {
    $this->info('menuPilot API — Sprint 1 backend');
})->purpose('Show menuPilot API information');
