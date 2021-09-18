<?php

namespace App\Http\Controllers;

use App\Department;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployee;
use App\Http\Requests\UpdateEmployee;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Yajra\Datatables\Datatables;

class EmployeeController extends Controller
{
    public function index()
    {
        if (!auth()->user()->can('view_employee')) {
            abort(403, 'Unauthorized Action');
        }

        return view('employee.index');
    }

    public function ssd(Request $request)
    {
        if (!auth()->user()->can('view_employee')) {
            abort(403, 'Unauthorized Action');
        }

        $employees = User::with('department');

        return Datatables::of($employees)
            ->filterColumn('department_name', function ($query, $keyword) {
                $query->whereHas('department', function ($q1) use ($keyword) {
                    $q1->where('title', 'like', '%' . $keyword . '%');
                });
            })
            ->editColumn('profile_img', function ($each) {
                return '<img src="' . $each->profile_img_path() . '" alt="" class="profile-thumbnail"><p class="my-1">' . $each->name . '</p>';
            })
            ->addColumn('department_name', function ($each) {
                return $each->department ? $each->department->title : '-';
            })
            ->addColumn('role_name', function ($each) {
                $output = '';
                foreach ($each->roles as $role) {
                    $output .= '<span class="badge badge-pill badge-primary m-1">' . $role->name . '</span>';
                }
                return $output;
            })
            ->editColumn('is_present', function ($each) {
                if ($each->is_present == 1) {
                    return '<span class="badge badge-pill badge-success">Present</span>';
                } else {
                    return '<span class="badge badge-pill badge-danger">Leave</span>';
                }
            })
            ->editColumn('updated_at', function ($each) {
                return Carbon::parse($each->updated_at)->format('Y-m-d H:i:s');
            })
            ->addColumn('action', function ($each) {
                $edit_icon = '';
                $info_icon = '';
                $delete_icon = '';

                if (auth()->user()->can('edit_employee')) {
                    $edit_icon = '<a href="' . route('employee.edit', $each->id) . '" class="text-warning"><i class="far fa-edit"></i></a>';
                }

                if (auth()->user()->can('view_employee')) {
                    $info_icon = '<a href="' . route('employee.show', $each->id) . '" class="text-primary"><i class="fas fa-info-circle"></i></a>';
                }

                if (auth()->user()->can('delete_employee')) {
                    $delete_icon = '<a href="#" class="text-danger delete-btn" data-id="' . $each->id . '"><i class="fas fa-trash-alt"></i></a>';
                }

                return '<div class="action-icon">' . $edit_icon . $info_icon . $delete_icon . '</div>';
            })
            ->addColumn('plus-icon', function ($each) {
                return null;
            })
            ->rawColumns(['profile_img', 'role_name', 'is_present', 'action'])
            ->make(true);
    }

    public function create()
    {
        if (!auth()->user()->can('create_employee')) {
            abort(403, 'Unauthorized Action');
        }

        $departments = Department::orderBy('title')->get();
        $roles = Role::all();
        return view('employee.create', compact('departments', 'roles'));
    }

    public function store(StoreEmployee $request)
    {
        if (!auth()->user()->can('create_employee')) {
            abort(403, 'Unauthorized Action');
        }

        $profile_img_name = null;
        if ($request->hasFile('profile_img')) {
            $profile_img_file = $request->file('profile_img');
            $profile_img_name = uniqid() . '_' . time() . '.' . $profile_img_file->getClientOriginalExtension();
            Storage::disk('public')->put('employee/' . $profile_img_name, file_get_contents($profile_img_file));
        }

        $employee = new User();
        $employee->employee_id = $request->employee_id;
        $employee->name = $request->name;
        $employee->phone = $request->phone;
        $employee->email = $request->email;
        $employee->nrc_number = $request->nrc_number;
        $employee->gender = $request->gender;
        $employee->birthday = $request->birthday;
        $employee->address = $request->address;
        $employee->department_id = $request->department_id;
        $employee->date_of_join = $request->date_of_join;
        $employee->is_present = $request->is_present;
        $employee->profile_img = $profile_img_name;
        $employee->pin_code = $request->pin_code;
        $employee->password = Hash::make($request->password);
        $employee->save();

        $employee->syncRoles($request->roles);

        return redirect()->route('employee.index')->with('create', 'Employee is successfully created.');
    }

    public function edit($id)
    {
        if (!auth()->user()->can('edit_employee')) {
            abort(403, 'Unauthorized Action');
        }

        $employee = User::findOrFail($id);
        $old_roles = $employee->roles->pluck('id')->toArray();
        $departments = Department::orderBy('title')->get();
        $roles = Role::all();

        return view('employee.edit', compact('employee', 'old_roles', 'departments', 'roles'));
    }

    public function update($id, UpdateEmployee $request)
    {
        if (!auth()->user()->can('edit_employee')) {
            abort(403, 'Unauthorized Action');
        }

        $employee = User::findOrFail($id);

        $profile_img_name = $employee->profile_img;
        if ($request->hasFile('profile_img')) {
            Storage::disk('public')->delete('employee/' . $employee->profile_img);

            $profile_img_file = $request->file('profile_img');
            $profile_img_name = uniqid() . '_' . time() . '.' . $profile_img_file->getClientOriginalExtension();
            Storage::disk('public')->put('employee/' . $profile_img_name, file_get_contents($profile_img_file));
        }

        $employee->employee_id = $request->employee_id;
        $employee->name = $request->name;
        $employee->phone = $request->phone;
        $employee->email = $request->email;
        $employee->nrc_number = $request->nrc_number;
        $employee->gender = $request->gender;
        $employee->birthday = $request->birthday;
        $employee->address = $request->address;
        $employee->department_id = $request->department_id;
        $employee->date_of_join = $request->date_of_join;
        $employee->is_present = $request->is_present;
        $employee->profile_img = $profile_img_name;
        $employee->pin_code = $request->pin_code;
        $employee->password = $request->password ? Hash::make($request->password) : $employee->password;
        $employee->update();

        $employee->syncRoles($request->roles);

        return redirect()->route('employee.index')->with('update', 'Employee is successfully updated.');
    }

    public function show($id)
    {
        if (!auth()->user()->can('view_employee')) {
            abort(403, 'Unauthorized Action');
        }

        $employee = User::findOrFail($id);
        return view('employee.show', compact('employee'));
    }

    public function destroy($id)
    {
        if (!auth()->user()->can('delete_employee')) {
            abort(403, 'Unauthorized Action');
        }

        $employee = User::findOrFail($id);
        $employee->delete();

        return 'success';
    }
}
