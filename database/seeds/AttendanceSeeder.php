<?php

namespace Database\Seeders;

use App\User;
use Carbon\Carbon;
use App\CheckinCheckout;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $users = User::all();
        foreach($users as $user){
            $periods = new CarbonPeriod('2021-01-01', '2021-12-31');
            foreach($periods as $period){
                if($period->format('D') != 'Sat' && $period->format('D') != 'Sun'){
                    $attendance = new CheckinCheckout();
                    $attendance->user_id = $user->id;
                    $attendance->date = $period->format('Y-m-d');
                    $attendance->checkin_time = Carbon::parse($period->format('Y-m-d') . ' ' . '09:00:00')->subMinutes(rand(1, 55));
                    $attendance->checkout_time = Carbon::parse($period->format('Y-m-d') . ' ' . '18:00:00')->addMinutes(rand(1, 55));
                    $attendance->save();
                }
            }
        }
    }
}
