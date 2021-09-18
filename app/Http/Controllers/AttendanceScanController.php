<?php

namespace App\Http\Controllers;

use App\CheckinCheckout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AttendanceScanController extends Controller
{
    public function scan(){
        return view('attendance_scan');
    }

    public function scanStore(Request $request){
        if(now()->format('D') == 'Sat' || now()->format('D') == 'Sun'){
            return [
                'status' => 'fail',
                'message' => 'Today is off day.',
            ];
        }
        
        if(!Hash::check(date('Y-m-d'), $request->hash_value)){
            return [
                'status' => 'fail',
                'message' => 'QR code is invalid.',
            ];
        }

        $user = auth()->user();

        $checkin_checkout_data = CheckinCheckout::firstOrCreate(
            [
                'user_id' => $user->id,
                'date' => now()->format('Y-m-d'),
            ]
        );

        if (!is_null($checkin_checkout_data->checkin_time) && !is_null($checkin_checkout_data->checkout_time)) {
            return [
                'status' => 'fail',
                'message' => 'Already checkin and checkout today.',
            ];
        }

        if (is_null($checkin_checkout_data->checkin_time)) {
            $checkin_checkout_data->checkin_time = now();
            $message = 'Successfully check in at ' . now();
        } else {
            if (is_null($checkin_checkout_data->checkout_time)) {
                $checkin_checkout_data->checkout_time = now();
                $message = 'Successfully check out at ' . now();
            }
        }

        $checkin_checkout_data->update();

        return [
            'status' => 'success',
            'message' => $message,
        ];
    }
}
