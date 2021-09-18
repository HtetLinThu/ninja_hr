@extends('layouts.app')
@section('title', 'Create Salary')
@section('content')
<div class="card">
    <div class="card-body">
        <form action="{{route('salary.store')}}" method="POST" autocomplete="off" enctype="multipart/form-data" id="create-form">
            @csrf

            <div class="form-group">
                <label for="">Employee</label>
                <select name="user_id" class="form-control select-ninja">
                    <option value="">-- Please Choose --</option>
                    @foreach ($employees as $employee)
                    <option value="{{$employee->id}}" @if(old('user_id') == $employee->id) selected @endif>{{$employee->employee_id}} ({{$employee->name}})</option>
                    @endforeach
                </select>
            </div>

            <div class="form-group">
                <label for="">Month</label>
                <select name="month" class="form-control select-month">
                    <option value="">-- Please Choose (Month) --</option>
                    <option value="01">Jan</option>
                    <option value="02">Feb</option>
                    <option value="03">Mar</option>
                    <option value="04">Apr</option>
                    <option value="05">May</option>
                    <option value="06">Jun</option>
                    <option value="07">Jul</option>
                    <option value="08">Aug</option>
                    <option value="09">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dec</option>
                </select>
            </div>

            <div class="form-group">
                <label for="">Year</label>
                <select name="year" class="form-control select-year">
                    <option value="">-- Please Choose (Year) --</option>
                    @for ($i = 0; $i < 15; $i++)
                    <option value="{{now()->addYears(5)->subYears($i)->format('Y')}}">
                        {{now()->addYears(5)->subYears($i)->format('Y')}}
                    </option>
                    @endfor
                </select>
            </div>

            <div class="md-form">
                <label for="">Amount (MMK)</label>
                <input type="number" name="amount" class="form-control">
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
{!!JsValidator::formRequest('App\Http\Requests\StoreSalary', '#create-form');!!}

<script>
    $(document).ready(function(){
        $('.select-month').select2({
            placeholder: '-- Please Choose (Month) --',
            allowClear: true,
            theme: 'bootstrap4'
        });

        $('.select-year').select2({
            placeholder: '-- Please Choose (Year) --',
            allowClear: true,
            theme: 'bootstrap4'
        });
    });
</script>
@endsection
