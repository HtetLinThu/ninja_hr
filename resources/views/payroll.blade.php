@extends('layouts.app')
@section('title', 'Payroll')
@section('content')
<div class="card">
    <div class="card-body">
        <div class="row mb-3">
            <div class="col-md-3">
                <input type="text" class="form-control employee_name" placeholder="Employee Name">
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <select name="" class="form-control select-month">
                        <option value="">-- Please Choose (Month) --</option>
                        <option value="01" @if(now()->format('m') == '01') selected @endif>Jan</option>
                        <option value="02" @if(now()->format('m') == '02') selected @endif>Feb</option>
                        <option value="03" @if(now()->format('m') == '03') selected @endif>Mar</option>
                        <option value="04" @if(now()->format('m') == '04') selected @endif>Apr</option>
                        <option value="05" @if(now()->format('m') == '05') selected @endif>May</option>
                        <option value="06" @if(now()->format('m') == '06') selected @endif>Jun</option>
                        <option value="07" @if(now()->format('m') == '07') selected @endif>Jul</option>
                        <option value="08" @if(now()->format('m') == '08') selected @endif>Aug</option>
                        <option value="09" @if(now()->format('m') == '09') selected @endif>Sep</option>
                        <option value="10" @if(now()->format('m') == '10') selected @endif>Oct</option>
                        <option value="11" @if(now()->format('m') == '11') selected @endif>Nov</option>
                        <option value="12" @if(now()->format('m') == '12') selected @endif>Dec</option>
                    </select>
                </div>
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <select name="" class="form-control select-year">
                        <option value="">-- Please Choose (Year) --</option>
                        @for ($i = 0; $i < 5; $i++)
                        <option value="{{now()->subYears($i)->format('Y')}}" @if(now()->format('Y') == now()->subYears($i)->format('Y')) selected @endif>
                            {{now()->subYears($i)->format('Y')}}
                        </option>
                        @endfor
                    </select>
                </div>
            </div>
            <div class="col-md-3">
                <button class="btn btn-theme btn-sm btn-block search-btn"><i class="fas fa-search"></i> Search</button>
            </div>
        </div>

        <div class="payroll_table"></div>
    </div>
</div>
@endsection
@section('script')
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

        payrollTable();

        function payrollTable(){
            var employee_name = $('.employee_name').val();
            var month = $('.select-month').val();
            var year = $('.select-year').val();

            $.ajax({
                url: `/payroll-table?employee_name=${employee_name}&month=${month}&year=${year}`,
                type: 'GET',
                success: function(res){
                    $('.payroll_table').html(res);
                }
            });
        }

        $('.search-btn').on('click', function(event){
            event.preventDefault();
            payrollTable();
        });
    });
</script>
@endsection
