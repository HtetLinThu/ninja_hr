<?php

namespace App\Http\Controllers;

use App\CheckinCheckout;
use App\CompanySetting;
use App\Http\Controllers\Controller;
use App\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function payroll(Request $request)
    {
        if (!auth()->user()->can('view_payroll')) {
            abort(403, 'Unauthorized Action');
        }

        return view('payroll');
    }

    public function payrollTable(Request $request)
    {
        if (!auth()->user()->can('view_payroll')) {
            abort(403, 'Unauthorized Action');
        }

        $month = $request->month;
        $year = $request->year;
        $startOfMonth = $year . '-' . $month . '-01';
        $endOfMonth = Carbon::parse($startOfMonth)->endOfMonth()->format('Y-m-d');
        $daysInMonth = Carbon::parse($startOfMonth)->daysInMonth;

        $workingDays = Carbon::parse($startOfMonth)->subDays(1)->diffInDaysFiltered(function (Carbon $date) {
            return $date->isWeekday();
        }, Carbon::parse($endOfMonth));

        $offDays = $daysInMonth - $workingDays;

        $employees = User::orderBy('employee_id')->where('name', 'like', '%' . $request->employee_name . '%')->get();
        $company_setting = CompanySetting::findOrFail(1);
        $periods = new CarbonPeriod($startOfMonth, $endOfMonth);
        $attendances = CheckinCheckout::whereMonth('date', $month)->whereYear('date', $year)->get();
        return view('components.payroll_table', compact('employees', 'company_setting', 'periods', 'attendances', 'daysInMonth', 'workingDays', 'offDays', 'month', 'year'))->render();
    }
}
