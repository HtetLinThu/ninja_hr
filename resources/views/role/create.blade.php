@extends('layouts.app')
@section('title', 'Create Role')
@section('content')
<div class="card">
    <div class="card-body">
        <form action="{{route('role.store')}}" method="POST" autocomplete="off" enctype="multipart/form-data"
            id="create-form">
            @csrf

            <div class="md-form">
                <label for="">Name</label>
                <input type="text" name="name" class="form-control">
            </div>

            <label for="">Permission</label>
            <div class="row">
                @foreach ($permissions as $permission)
                <div class="col-md-3 col-6">
                    <div class="custom-control custom-checkbox">
                        <input type="checkbox" name="permissions[]" class="custom-control-input" id="checkbox_{{$permission->id}}" value="{{$permission->name}}">
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
{!!JsValidator::formRequest('App\Http\Requests\StoreRole', '#create-form');!!}

<script>
    $(document).ready(function(){
    });
</script>
@endsection
