<?php

namespace App\Http\Controllers;

use App\User;
use App\Project;
use App\ProjectLeader;
use App\ProjectMember;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Yajra\Datatables\Datatables;
use App\Http\Requests\StoreProject;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProject;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    public function index()
    {
        if (!auth()->user()->can('view_project')) {
            abort(403, 'Unauthorized Action');
        }

        return view('project.index');
    }

    public function ssd(Request $request)
    {
        if (!auth()->user()->can('view_project')) {
            abort(403, 'Unauthorized Action');
        }

        $projects = Project::with('leaders', 'members');

        return Datatables::of($projects)
            ->editColumn('description', function ($each) {
                return Str::limit($each->description, 150);
            })
            ->addColumn('leaders', function ($each) {
                $output = '<div style="width:160px;">';
                foreach ($each->leaders as $leader) {
                    $output .= '<img src="' . $leader->profile_img_path() . '" alt="" class="profile-thumbnail2">';
                }

                return $output . '</div>';
            })
            ->addColumn('members', function ($each) {
                $output = '<div style="width:160px;">';
                foreach ($each->members as $member) {
                    $output .= '<img src="' . $member->profile_img_path() . '" alt="" class="profile-thumbnail2">';
                }

                return $output . '</div>';
            })
            ->editColumn('priority', function ($each) {
                if ($each->priority == 'high') {
                    return '<span class="badge badge-pill badge-danger">High</span>';
                } else if ($each->priority == 'middle') {
                    return '<span class="badge badge-pill badge-info">Middle</span>';
                } else if ($each->priority == 'low') {
                    return '<span class="badge badge-pill badge-dark">Low</span>';
                }
            })
            ->editColumn('status', function ($each) {
                if ($each->status == 'pending') {
                    return '<span class="badge badge-pill badge-warning">Pending</span>';
                } else if ($each->status == 'in_progress') {
                    return '<span class="badge badge-pill badge-info">In Progress</span>';
                } else if ($each->status == 'low') {
                    return '<span class="badge badge-pill badge-success">Complete</span>';
                }
            })
            ->addColumn('action', function ($each) {
                $info_icon = '';
                $edit_icon = '';
                $delete_icon = '';

                if (auth()->user()->can('view_project')) {
                    $info_icon = '<a href="' . route('project.show', $each->id) . '" class="text-primary"><i class="fas fa-info-circle"></i></a>';
                }

                if (auth()->user()->can('edit_project')) {
                    $edit_icon = '<a href="' . route('project.edit', $each->id) . '" class="text-warning"><i class="far fa-edit"></i></a>';
                }

                if (auth()->user()->can('delete_project')) {
                    $delete_icon = '<a href="#" class="text-danger delete-btn" data-id="' . $each->id . '"><i class="fas fa-trash-alt"></i></a>';
                }

                return '<div class="action-icon">' . $info_icon . $edit_icon . $delete_icon . '</div>';
            })
            ->addColumn('plus-icon', function ($each) {
                return null;
            })
            ->rawColumns(['leaders', 'members', 'priority', 'status', 'action'])
            ->make(true);
    }

    public function create()
    {
        if (!auth()->user()->can('create_project')) {
            abort(403, 'Unauthorized Action');
        }

        $employees = User::orderBy('name')->get();
        return view('project.create', compact('employees'));
    }

    public function store(StoreProject $request)
    {
        if (!auth()->user()->can('create_project')) {
            abort(403, 'Unauthorized Action');
        }

        $image_names = null;
        if ($request->hasFile('images')) {
            $image_names = [];
            $images_file = $request->file('images');
            foreach ($images_file as $image_file) {
                $image_name = uniqid() . '_' . time() . '.' . $image_file->getClientOriginalExtension();
                Storage::disk('public')->put('project/' . $image_name, file_get_contents($image_file));
                $image_names[] = $image_name;
            }
        }

        $file_names = null;
        if ($request->hasFile('files')) {
            $file_names = [];
            $files = $request->file('files');
            foreach ($files as $file) {
                $file_name = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                Storage::disk('public')->put('project/' . $file_name, file_get_contents($file));
                $file_names[] = $file_name;
            }
        }

        $project = new Project();
        $project->title = $request->title;
        $project->description = $request->description;
        $project->images = $image_names;
        $project->files = $file_names;
        $project->start_date = $request->start_date;
        $project->deadline = $request->deadline;
        $project->priority = $request->priority;
        $project->status = $request->status;
        $project->save();

        $project->leaders()->sync($request->leaders);
        $project->members()->sync($request->members);

        return redirect()->route('project.index')->with('create', 'Project is successfully created.');
    }

    public function edit($id)
    {
        if (!auth()->user()->can('edit_project')) {
            abort(403, 'Unauthorized Action');
        }

        $project = Project::findOrFail($id);
        $employees = User::orderBy('name')->get();
        return view('project.edit', compact('project', 'employees'));
    }

    public function update($id, UpdateProject $request)
    {
        if (!auth()->user()->can('edit_project')) {
            abort(403, 'Unauthorized Action');
        }

        $project = Project::findOrFail($id);

        $image_names = $project->images;
        if ($request->hasFile('images')) {
            $image_names = [];
            $images_file = $request->file('images');
            foreach ($images_file as $image_file) {
                $image_name = uniqid() . '_' . time() . '.' . $image_file->getClientOriginalExtension();
                Storage::disk('public')->put('project/' . $image_name, file_get_contents($image_file));
                $image_names[] = $image_name;
            }
        }

        $file_names = $project->files;
        if ($request->hasFile('files')) {
            $file_names = [];
            $files = $request->file('files');
            foreach ($files as $file) {
                $file_name = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                Storage::disk('public')->put('project/' . $file_name, file_get_contents($file));
                $file_names[] = $file_name;
            }
        }

        $project->title = $request->title;
        $project->description = $request->description;
        $project->images = $image_names;
        $project->files = $file_names;
        $project->start_date = $request->start_date;
        $project->deadline = $request->deadline;
        $project->priority = $request->priority;
        $project->status = $request->status;
        $project->update();

        $project->leaders()->sync($request->leaders);
        $project->members()->sync($request->members);

        return redirect()->route('project.index')->with('update', 'Project is successfully updated.');
    }

    public function show($id)
    {
        if (!auth()->user()->can('view_project')) {
            abort(403, 'Unauthorized Action');
        }

        $project = Project::findOrFail($id);
        return view('project.show', compact('project'));
    }

    public function destroy($id)
    {
        if (!auth()->user()->can('delete_project')) {
            abort(403, 'Unauthorized Action');
        }

        $project = Project::findOrFail($id);

        $project->leaders()->detach();
        $project->members()->detach();

        $project->delete();

        return 'success';
    }
}
