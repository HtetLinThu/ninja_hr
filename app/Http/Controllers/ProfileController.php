<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function profile(){
        $employee = auth()->user();
        $biometrics = DB::table('web_authn_credentials')->where('user_id', $employee->id)->get();
        return view('profile.profile', compact('employee', 'biometrics'));
    }

    public function biometricData(){
        $employee = auth()->user();
        $biometrics = DB::table('web_authn_credentials')->where('user_id', $employee->id)->get();
        return view('components.biometric_data', compact('employee', 'biometrics'))->render();
    }

    public function biometricDataDestroy($id){
        $employee = auth()->user();
        $biometric = DB::table('web_authn_credentials')->where('id', $id)->where('user_id', $employee->id)->delete();
        return 'success';
    }
}
