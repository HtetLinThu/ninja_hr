<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSalary;
use App\Http\Requests\UpdateSalary;
use App\Salary;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Yajra\Datatables\Datatables;

class SalaryController extends Controller
{
    public function index()
    {
        if (!auth()->user()->can('view_salary')) {
            abort(403, 'Unauthorized Action');
        }

        return view('salary.index');
    }

    public function ssd(Request $request)
    {
        if (!auth()->user()->can('view_salary')) {
            abort(403, 'Unauthorized Action');
        }

        $salaries = Salary::with('employee');

        return Datatables::of($salaries)
            ->filterColumn('employee_name', function ($query, $keyword) {
                $query->whereHas('employee', function ($q1) use ($keyword) {
                    $q1->where('name', 'like', '%' . $keyword . '%');
                });
            })
            ->addColumn('employee_name', function ($each) {
                return $each->employee ? $each->employee->name : '-';
            })
            ->editColumn('month', function ($each) {
                return Carbon::parse('2021-' . $each->month . '-01')->format('M');
            })
            ->editColumn('amount', function ($each) {
                return number_format($each->amount);
            })
            ->addColumn('action', function ($each) {
                $edit_icon = '';
                $delete_icon = '';

                if (auth()->user()->can('edit_salary')) {
                    $edit_icon = '<a href="' . route('salary.edit', $each->id) . '" class="text-warning"><i class="far fa-edit"></i></a>';
                }

                if (auth()->user()->can('delete_salary')) {
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
        if (!auth()->user()->can('create_salary')) {
            abort(403, 'Unauthorized Action');
        }

        $employees = User::orderBy("employee_id")->get();
        return view('salary.create', compact('employees'));
    }

    public function store(StoreSalary $request)
    {
        if (!auth()->user()->can('create_salary')) {
            abort(403, 'Unauthorized Action');
        }

        $salary = new Salary();
        $salary->user_id = $request->user_id;
        $salary->month = $request->month;
        $salary->year = $request->year;
        $salary->amount = $request->amount;
        $salary->save();

        return redirect()->route('salary.index')->with('create', 'Salary is successfully created.');
    }

    public function edit($id)
    {
        if (!auth()->user()->can('edit_salary')) {
            abort(403, 'Unauthorized Action');
        }

        $salary = Salary::findOrFail($id);
        $employees = User::orderBy("employee_id")->get();
        return view('salary.edit', compact('salary', 'employees'));
    }

    public function update($id, UpdateSalary $request)
    {
        if (!auth()->user()->can('edit_salary')) {
            abort(403, 'Unauthorized Action');
        }

        $salary = Salary::findOrFail($id);
        $salary->user_id = $request->user_id;
        $salary->month = $request->month;
        $salary->year = $request->year;
        $salary->amount = $request->amount;
        $salary->update();

        return redirect()->route('salary.index')->with('update', 'Salary is successfully updated.');
    }

    public function destroy($id)
    {
        if (!auth()->user()->can('delete_salary')) {
            abort(403, 'Unauthorized Action');
        }

        $salary = Salary::findOrFail($id);
        $salary->delete();

        return 'success';
    }
}
