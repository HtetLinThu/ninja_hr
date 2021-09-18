@extends('layouts.app')
@section('title', 'Edit Role')
@section('content')
<div class="card">
    <div class="card-body">
        <form action="{{route('role.update', $role->id)}}" method="POST" autocomplete="off" id="edit-form" enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="md-form">
                <label for="">Name</label>
                <input type="text" name="name" class="form-control" value="{{$role->name}}">
            </div>

            <label for="">Permission</label>
            <div class="row">
                @foreach ($permissions as $permission)
                <div class="col-md-3 col-6">
                    <div class="custom-control custom-checkbox">
                        <input type="checkbox" name="permissions[]" class="custom-control-input" id="checkbox_{{$permission->id}}" value="{{$permission->name}}" @if(in_array($permission->id, $old_permissions)) checked @endif>
                        <label class="custom-control-label pt-1" for="checkbox_{{$permission->id}}">{{$permission->name}}</label>
                    </div>
                </div>
                @endforeach
            </div>

            <div class="d-flex justify-content-center mt-5 mb-3">
                <div class="col-md-6">
                    <button type="submit" class="btn btn-theme btn-sm btn-block">Confirm</button>
                </div>
            </div>
        </form>
    </div>
</div>
@endsection
@section('script')
{!!JsValidator::formRequest('App\Http\Requests\UpdateRole', '#edit-form');!!}

<script>
    $(document).ready(function(){
    });
</script>
@endsection
