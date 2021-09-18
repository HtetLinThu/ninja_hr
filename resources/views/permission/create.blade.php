@extends('layouts.app')
@section('title', 'Create Permission')
@section('content')
<div class="card">
    <div class="card-body">
        <form action="{{route('permission.store')}}" method="POST" autocomplete="off" enctype="multipart/form-data" id="create-form">
            @csrf

            <div class="md-form">
                <label for="">Name</label>
                <input type="text" name="name" class="form-control">
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
{!!JsValidator::formRequest('App\Http\Requests\StorePermission', '#create-form');!!}

<script>
    $(document).ready(function(){
    });
</script>
@endsection
