@extends('layouts.app')
@section('title', 'Employee Detail')
@section('content')
<div class="card">
    <div class="card-body">
        <div class="row">
            <div class="col-md-6">
                <div class="text-center">
                    <img src="{{$employee->profile_img_path()}}" alt="" class="profile-img">
                    <div class="py-3 px-3">
                        <h4>{{$employee->name}}</h4>
                        <p class="text-muted mb-2"><span class="text-muted">{{$employee->employee_id}}</span> | <span
                                class="text-theme">{{$employee->phone}}</span></p>
                        <p class="text-muted mb-2"><span
                                class="badge badge-pill badge-light border">{{$employee->department ? $employee->department->title : '-'}}</span>
                        </p>
                        <p class="text-muted mb-2">
                            @foreach ($employee->roles as $role)
                            <span class="badge badge-pill badge-primary">{{$role->name}}</span>
                            @endforeach
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 dash-border">
                <p class="mb-1"><strong>Phone</strong> : <span class="text-muted">{{$employee->phone}}</span></p>
                <p class="mb-1"><strong>Email</strong> : <span class="text-muted">{{$employee->email}}</span></p>
                <p class="mb-1"><strong>NRC Number</strong> : <span class="text-muted">{{$employee->nrc_number}}</span>
                </p>
                <p class="mb-1"><strong>Gender</strong> : <span class="text-muted">{{ucfirst($employee->gender)}}</span>
                </p>
                <p class="mb-1"><strong>Birthday</strong> : <span class="text-muted">{{$employee->birthday}}</span>
                </p>
                <p class="mb-1"><strong>Address</strong> : <span class="text-muted">{{$employee->address}}</span>
                </p>

                <p class="mb-1"><strong>Date of Join</strong> : <span
                        class="text-muted">{{$employee->date_of_join}}</span></p>
                <p class="mb-1"><strong>Is Present?</strong> :
                    @if($employee->is_present == 1)
                    <span class="badge badge-pill badge-success">Present</span>
                    @else
                    <span class="badge badge-pill badge-danger">Leave</span>
                    @endif
                </p>
            </div>
        </div>
    </div>
</div>
@endsection
