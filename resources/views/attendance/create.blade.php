@extends('layouts.app')
@section('title', 'Create Attendance')
@section('extra_css')
<style>
    .daterangepicker .drp-calendar.left {
        margin-right: 8px !important;
    }
</style>
@endsection
@section('content')
<div class="card">
    <div class="card-body">
        @include('layouts.error')

        <form action="{{route('attendance.store')}}" method="POST" autocomplete="off" enctype="multipart/form-data"
            id="create-form">
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

            <div class="md-form">
                <label for="">Date</label>
                <input type="text" name="date" class="form-control date" value="{{old('date')}}">
            </div>

            <div class="md-form">
                <label for="">Checkin Time</label>
                <input type="text" name="checkin_time" class="form-control timepicker" value="{{old('checkin_time')}}">
            </div>

            <div class="md-form">
                <label for="">Checkout Time</label>
                <input type="text" name="checkout_time" class="form-control timepicker" value="{{old('checkout_time')}}">
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
{!!JsValidator::formRequest('App\Http\Requests\StoreAttendance', '#create-form');!!}

<script>
    $(document).ready(function(){
        $('.date').daterangepicker({
            "singleDatePicker": true,
            "autoApply": true,
            "showDropdowns": true,
            "locale": {
                "format": "YYYY-MM-DD",
            }
        });

        $('.timepicker').daterangepicker({
            "singleDatePicker": true,
            "timePicker": true,
            "timePicker24Hour": true,
            "timePickerSeconds": true,
            "autoApply": true,
            "locale": {
                "format": "HH:mm:ss",
            }
        }).on('show.daterangepicker', function(ev, picker) {
            picker.container.find('.calendar-table').hide();
        });
    });
</script>
@endsection
