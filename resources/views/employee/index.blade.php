@extends('layouts.app')
@section('title', 'Employees')
@section('content')
<div>
    @can('create_employee')
    <a href="{{route('employee.create')}}" class="btn btn-theme btn-sm"><i class="fas fa-plus-circle"></i> Create
        Employee</a>
    @endcan
</div>
<div class="card">
    <div class="card-body">
        <table class="table table-bordered Datatable" style="width:100%;">
            <thead>
                <th class="text-center no-sort no-search"></th>
                <th class="text-center no-sort"></th>
                <th class="text-center">Employee ID</th>
                <th class="text-center">Phone</th>
                <th class="text-center">Email</th>
                <th class="text-center">Department</th>
                <th class="text-center">Role (or) Designation</th>
                <th class="text-center">Is Present?</th>
                <th class="text-center no-sort">Action</th>
                <th class="text-center no-search hidden">Updated at</th>
            </thead>
        </table>
    </div>
</div>
@endsection
@section('script')
<script>
    $(document).ready(function(){
            var table = $('.Datatable').DataTable({
                ajax: '/employee/datatable/ssd',
                columns: [
                    { data: 'plus-icon', name: 'plus-icon', class: 'text-center' },
                    { data: 'profile_img', name: 'profile_img', class: 'text-center' },
                    { data: 'employee_id', name: 'employee_id', class: 'text-center' },
                    { data: 'phone', name: 'phone', class: 'text-center' },
                    { data: 'email', name: 'email', class: 'text-center' },
                    { data: 'department_name', name: 'department_name', class: 'text-center' },
                    { data: 'role_name', name: 'role_name', class: 'text-center' },
                    { data: 'is_present', name: 'is_present', class: 'text-center' },
                    { data: 'action', name: 'action', class: 'text-center' },
                    { data: 'updated_at', name: 'updated_at', class: 'text-center' },
                ],
                order: [[ 9, "desc" ]],
            });

            $(document).on('click', '.delete-btn', function(e){
                e.preventDefault();

                var id = $(this).data('id');

                swal({
                    text: "Are you sure you want to delete?",
                    buttons: true,
                    dangerMode: true,
                })
                .then((willDelete) => {
                    if (willDelete) {
                        $.ajax({
                            method: "DELETE",
                            url: `/employee/${id}`,
                        }).done(function( res ) {
                            table.ajax.reload();
                        });
                    }
                });
            });
        });
</script>
@endsection
