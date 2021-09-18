<?php

namespace App\Http\Controllers;

use App\CheckinCheckout;
use App\CompanySetting;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendance;
use App\Http\Requests\UpdateAttendance;
use App\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Yajra\Datatables\Datatables;

class AttendanceController extends Controller
{
    public function index()
    {
        if (!auth()->user()->can('view_attendance')) {
            abort(403, 'Unauthorized Action');
        }

        return view('attendance.index');
    }

    public function ssd(Request $request)
    {
        if (!auth()->user()->can('view_attendance')) {
            abort(403, 'Unauthorized Action');
        }

        $attendances = CheckinCheckout::with('employee');

        return Datatables::of($attendances)
            ->filterColumn('employee_name', function ($query, $keyword) {
                $query->whereHas('employee', function ($q1) use ($keyword) {
                    $q1->where('name', 'like', '%' . $keyword . '%');
                });
            })
            ->addColumn('employee_name', function ($each) {
                return $each->employee ? $each->employee->name : '-';
            })
            ->addColumn('action', function ($each) {
                $edit_icon = '';
                $delete_icon = '';

                if (auth()->user()->can('edit_attendance')) {
                    $edit_icon = '<a href="' . route('attendance.edit', $each->id) . '" class="text-warning"><i class="far fa-edit"></i></a>';
                }

                if (auth()->user()->can('delete_attendance')) {
                    $delete_icon = '<a href="#" class="text-danger delete-btn" data-id="' . $each->id . '"><i class="fas fa-trash-alt"></i></a>';
                }

                return '<div class="action-icon">' . $edit_icon . $delete_icon . '</div>';
            })
            ->addColumn('plus-icon', function ($each) {
                return null;
            })
            ->rawColumns(['action'])
            ->make(true);
    }

    public function create()
    {
        if (!auth()->user()->can('create_attendance')) {
            abort(403, 'Unauthorized Action');
        }

        $employees = User::orderBy("employee_id")->get();
        return view('attendance.create', compact('employees'));
    }

    public function store(StoreAttendance $request)
    {
        if (!auth()->user()->can('create_attendance')) {
            abort(403, 'Unauthorized Action');
        }

        if (CheckinCheckout::where('user_id', $request->user_id)->where('date', $request->date)->exists()) {
            return back()->withErrors(['fail' => 'Already defined.'])->withInput();
        }

        $attendance = new CheckinCheckout();
        $attendance->user_id = $request->user_id;
        $attendance->date = $request->date;
        $attendance->checkin_time = $request->date . ' ' . $request->checkin_time;
        $attendance->checkout_time = $request->date . ' ' . $request->checkout_time;
        $attendance->save();

        return redirect()->route('attendance.index')->with('create', 'Attendance is successfully created.');
    }

    public function edit($id)
    {
        if (!auth()->user()->can('edit_attendance')) {
            abort(403, 'Unauthorized Action');
        }

        $attendance = CheckinCheckout::findOrFail($id);
        $employees = User::orderBy("employee_id")->get();
        return view('attendance.edit', compact('attendance', 'employees'));
    }

    public function update($id, UpdateAttendance $request)
    {
        if (!auth()->user()->can('edit_attendance')) {
            abort(403, 'Unauthorized Action');
        }

        $attendance = CheckinCheckout::findOrFail($id);

        if (CheckinCheckout::where('user_id', $request->user_id)->where('date', $request->date)->where('id', '!=', $attendance->id)->exists()) {
            return back()->withErrors(['fail' => 'Already defined.'])->withInput();
        }

        $attendance->user_id = $request->user_id;
        $attendance->date = $request->date;
        $attendance->checkin_time = $request->date . ' ' . $request->checkin_time;
        $attendance->checkout_time = $request->date . ' ' . $request->checkout_time;
        $attendance->update();

        return redirect()->route('attendance.index')->with('update', 'Attendance is successfully updated.');
    }

    public function destroy($id)
    {
        if (!auth()->user()->can('delete_attendance')) {
            abort(403, 'Unauthorized Action');
        }

        $attendance = CheckinCheckout::findOrFail($id);
        $attendance->delete();

        return 'success';
    }

    public function overview(Request $request)
    {
        if (!auth()->user()->can('view_attendance_overview')) {
            abort(403, 'Unauthorized Action');
        }

        return view('attendance.overview');
    }

    public function overviewTable(Request $request)
    {
        if (!auth()->user()->can('view_attendance_overview')) {
            abort(403, 'Unauthorized Action');
        }

        $month = $request->month;
        $year = $request->year;
        $startOfMonth = $year . '-' . $month . '-01';
        $endOfMonth = Carbon::parse($startOfMonth)->endOfMonth()->format('Y-m-d');

        $employees = User::orderBy('employee_id')->where('name', 'like', '%' . $request->employee_name . '%')->get();
        $company_setting = CompanySetting::findOrFail(1);
        $periods = new CarbonPeriod($startOfMonth, $endOfMonth);
        $attendances = CheckinCheckout::whereMonth('date', $month)->whereYear('date', $year)->get();
        return view('components.attendance_overview_table', compact('employees', 'company_setting', 'periods', 'attendances'))->render();
    }
}
