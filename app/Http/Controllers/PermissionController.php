<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermission;
use App\Http\Requests\UpdatePermission;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Yajra\Datatables\Datatables;

class PermissionController extends Controller
{
    public function index()
    {
        if (!auth()->user()->can('view_permission')) {
            abort(403, 'Unauthorized Action');
        }

        return view('permission.index');
    }

    public function ssd(Request $request)
    {
        if (!auth()->user()->can('view_permission')) {
            abort(403, 'Unauthorized Action');
        }

        $permissions = Permission::query();

        return Datatables::of($permissions)
            ->editColumn("created_at", function($each){
                return $each->created_at->toDateTimeString();
            })
            ->editColumn("updated_at", function($each){
                return $each->updated_at->toDateTimeString();
            })
            ->addColumn('action', function ($each) {
                $edit_icon = '';
                $delete_icon = '';

                if (auth()->user()->can('edit_permission')) {
                    $edit_icon = '<a href="' . route('permission.edit', $each->id) . '" class="text-warning"><i class="far fa-edit"></i></a>';
                }

                if (auth()->user()->can('delete_permission')) {
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
        if (!auth()->user()->can('create_permission')) {
            abort(403, 'Unauthorized Action');
        }

        return view('permission.create');
    }

    public function store(StorePermission $request)
    {
        if (!auth()->user()->can('create_permission')) {
            abort(403, 'Unauthorized Action');
        }

        $permission = new Permission();
        $permission->name = $request->name;
        $permission->save();

        return redirect()->route('permission.index')->with('create', 'Permission is successfully created.');
    }

    public function edit($id)
    {
        if (!auth()->user()->can('edit_permission')) {
            abort(403, 'Unauthorized Action');
        }

        $permission = Permission::findOrFail($id);
        return view('permission.edit', compact('permission'));
    }

    public function update($id, UpdatePermission $request)
    {
        if (!auth()->user()->can('edit_permission')) {
            abort(403, 'Unauthorized Action');
        }

        $permission = Permission::findOrFail($id);
        $permission->name = $request->name;
        $permission->update();

        return redirect()->route('permission.index')->with('update', 'Permission is successfully updated.');
    }

    public function destroy($id)
    {
        if (!auth()->user()->can('delete_permission')) {
            abort(403, 'Unauthorized Action');
        }

        $permission = Permission::findOrFail($id);
        $permission->delete();

        return 'success';
    }
}
