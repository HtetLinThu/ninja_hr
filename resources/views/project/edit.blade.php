@extends('layouts.app')
@section('title', 'Edit Project')
@section('content')
<div class="card">
    <div class="card-body">
        <form action="{{route('project.update', $project->id)}}" method="POST" autocomplete="off" id="edit-form"
            enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="md-form">
                <label for="">Title</label>
                <input type="text" name="title" class="form-control" value="{{$project->title}}">
            </div>

            <div class="md-form">
                <label for="">Description</label>
                <textarea name="description" class="form-control md-textarea" rows="5">{{$project->description}}</textarea>
            </div>

            <div class="form-group">
                <label for="images">Images (Only PNG, JPG, JPEG)</label>
                <input type="file" name="images[]" class="form-control p-1" id="images" multiple
                    accept="image/.png,.jpg,.jpeg">

                <div class="preview_img my-2">
                    @if($project->images)
                    @foreach($project->images as $image)
                    <img src="{{asset('storage/project/' . $image)}}" alt="">
                    @endforeach
                    @endif
                </div>
            </div>

            <div class="form-group">
                <label for="files">Files (Only PDF)</label>
                <input type="file" name="files[]" class="form-control p-1" id="files" multiple accept="application/pdf">
                <div class="my-2">
                    @if($project->files)
                    @foreach($project->files as $file)
                    <a href="{{asset('storage/project/' . $file)}}" class="pdf-thumbnail" target="_blank"><i class="fas fa-file-pdf"></i> <p class="mb-0">File {{$loop->iteration}}</p></a>
                    @endforeach
                    @endif
                </div>
            </div>

            <div class="md-form">
                <label for="">Start Date</label>
                <input type="text" name="start_date" class="form-control datepicker" value="{{$project->start_date}}">
            </div>

            <div class="md-form">
                <label for="">Deadline</label>
                <input type="text" name="deadline" class="form-control datepicker" value="{{$project->deadline}}">
            </div>

            <div class="form-group">
                <label for="">Leader</label>
                <select name="leaders[]" class="form-control select-ninja" multiple>
                    <option value="">-- Please Choose --</option>
                    @foreach ($employees as $employee)
                    <option value="{{$employee->id}}" @if(in_array($employee->id, collect($project->leaders)->pluck('id')->toArray())) selected @endif>{{$employee->employee_id}} ({{$employee->name}})</option>
                    @endforeach
                </select>
            </div>

            <div class="form-group">
                <label for="">Member</label>
                <select name="members[]" class="form-control select-ninja" multiple>
                    <option value="">-- Please Choose --</option>
                    @foreach ($employees as $employee)
                    <option value="{{$employee->id}}" @if(in_array($employee->id, collect($project->members)->pluck('id')->toArray())) selected @endif>{{$employee->employee_id}} ({{$employee->name}})</option>
                    @endforeach
                </select>
            </div>

            <div class="form-group">
                <label for="">Priority</label>
                <select name="priority" class="form-control select-ninja">
                    <option value="">-- Please Choose --</option>
                    <option value="high" @if($project->priority == 'high') selected @endif>High</option>
                    <option value="middle" @if($project->priority == 'middle') selected @endif>Middle</option>
                    <option value="low" @if($project->priority == 'low') selected @endif>Low</option>
                </select>
            </div>

            <div class="form-group">
                <label for="">Status</label>
                <select name="status" class="form-control select-ninja">
                    <option value="">-- Please Choose --</option>
                    <option value="pending" @if($project->status == 'pending') selected @endif>Pending</option>
                    <option value="in_progress" @if($project->status == 'in_progress') selected @endif>In Progress</option>
                    <option value="complete" @if($project->status == 'complete') selected @endif>Complete</option>
                </select>
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
{!!JsValidator::formRequest('App\Http\Requests\UpdateProject', '#edit-form');!!}

<script>
    $(document).ready(function(){
        $('#images').on('change', function(){
            var file_length = document.getElementById('images').files.length;
            $('.preview_img').html('');
            for(var i = 0; i < file_length; i++){
                $('.preview_img').append(`<img src="${URL.createObjectURL(event.target.files[i])}"/>`);
            }
        });

        $('.datepicker').daterangepicker({
            "singleDatePicker": true,
            "autoApply": true,
            "showDropdowns": true,
            "locale": {
                "format": "YYYY-MM-DD",
            }
        });
    });
</script>
@endsection
