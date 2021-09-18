<?php

namespace App\Http\Controllers;

use App\CompanySetting;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CompanySettingController extends Controller
{
    public function show($id)
    {
        if(!auth()->user()->can('view_company_setting')){
            abort(403, 'Unauthorized Action');
        }

        $setting = CompanySetting::findOrFail($id);
        return view('company_setting.show', compact('setting'));
    }

    public function edit($id){
        if(!auth()->user()->can('edit_company_setting')){
            abort(403, 'Unauthorized Action');
        }

        $setting = CompanySetting::findOrFail($id);
        return view('company_setting.edit', compact('setting'));
    }

    public function update($id, Request $request){
        if(!auth()->user()->can('edit_company_setting')){
            abort(403, 'Unauthorized Action');
        }

        $setting = CompanySetting::findOrFail($id);
        $setting->company_name = $request->company_name;
        $setting->company_phone = $request->company_phone;
        $setting->company_email = $request->company_email;
        $setting->company_address = $request->company_address;
        $setting->office_start_time = $request->office_start_time;
        $setting->office_end_time = $request->office_end_time;
        $setting->break_start_time = $request->break_start_time;
        $setting->break_end_time = $request->break_end_time;
        $setting->update();

        return redirect()->route('company-setting.show', $setting->id)->with('update', 'Company Setting is successfully updated.');
    }
}
