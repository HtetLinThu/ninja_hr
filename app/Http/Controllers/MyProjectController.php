<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Project;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Yajra\Datatables\Datatables;

class MyProjectController extends Controller
{
    public function index()
    {
        return view('my_project');
    }

    public function ssd(Request $request)
    {
        $projects = Project::with('leaders', 'members')
            ->whereHas('leaders', function ($query) {
                $query->where('user_id', auth()->user()->id);
            })
            ->orWhereHas('members', function ($query) {
                $query->where('user_id', auth()->user()->id);
            });

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

                if (auth()->user()->can('view_project')) {
                    $info_icon = '<a href="' . route('my-project.show', $each->id) . '" class="text-primary"><i class="fas fa-info-circle"></i></a>';
                }

                return '<div class="action-icon">' . $info_icon . '</div>';
            })
            ->addColumn('plus-icon', function ($each) {
                return null;
            })
            ->rawColumns(['leaders', 'members', 'priority', 'status', 'action'])
            ->make(true);
    }

    public function show($id)
    {
        $project = Project::with('leaders', 'members', 'tasks')
            ->where('id', $id)
            ->where(function($query){
                $query->whereHas('leaders', function ($q1) {
                    $q1->where('user_id', auth()->user()->id);
                })
                ->orWhereHas('members', function ($q1) {
                    $q1->where('user_id', auth()->user()->id);
                });
            })
            ->firstOrFail();

        return view('my_project_show', compact('project'));
    }
}
