<?php

namespace App\Http\Controllers;

use App\User;
use Carbon\Carbon;
use App\CompanySetting;
use App\CheckinCheckout;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class MyPayrollController extends Controller
{
    public function ssd(Request $request)
    {
        return view('payroll');
    }

    public function payrollTable(Request $request)
    {
        $month = $request->month;
        $year = $request->year;
        $startOfMonth = $year . '-' . $month . '-01';
        $endOfMonth = Carbon::parse($startOfMonth)->endOfMonth()->format('Y-m-d');
        $daysInMonth = Carbon::parse($startOfMonth)->daysInMonth;

        $workingDays = Carbon::parse($startOfMonth)->diffInDaysFiltered(function (Carbon $date) {
            Log::info($date . ' -> ' . $date->isWeekday());
            return $date->isWeekday();
        }, Carbon::parse($endOfMonth)->addDays(1));

        $offDays = $daysInMonth - $workingDays;

        $employees = User::orderBy('employee_id')->where('id', auth()->user()->id)->get();
        $company_setting = CompanySetting::findOrFail(1);
        $periods = new CarbonPeriod($startOfMonth, $endOfMonth);
        $attendances = CheckinCheckout::whereMonth('date', $month)->whereYear('date', $year)->get();
        return view('components.payroll_table', compact('employees', 'company_setting', 'periods', 'attendances', 'daysInMonth', 'workingDays', 'offDays', 'month', 'year'))->render();
    }
}
