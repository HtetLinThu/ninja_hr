@extends('layouts.app')
@section('title', 'Permission')
@section('content')
<div>
    @can('create_permission')
    <a href="{{route('permission.create')}}" class="btn btn-theme btn-sm"><i class="fas fa-plus-circle"></i> Create
        Permission</a>
    @endcan
</div>
<div class="card">
    <div class="card-body">
        <table class="table table-bordered Datatable" style="width:100%;">
            <thead>
                <th class="text-center no-sort no-search"></th>
                <th class="text-center">Name</th>
                <th class="text-center">Created at</th>
                <th class="text-center">Updated at</th>
                <th class="text-center no-sort">Action</th>
            </thead>
        </table>
    </div>
</div>
@endsection
@section('script')
<script>
    $(document).ready(function(){
            var table = $('.Datatable').DataTable({
                ajax: '/permission/datatable/ssd',
                columns: [
                    { data: 'plus-icon', name: 'plus-icon', class: 'text-center' },
                    { data: 'name', name: 'name', class: 'text-center' },
                    { data: 'created_at', name: 'created_at', class: 'text-center' },
                    { data: 'updated_at', name: 'updated_at', class: 'text-center' },
                    { data: 'action', name: 'action', class: 'text-center' },
                ],
                order: [[ 3, "desc" ]],
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
                            url: `/permission/${id}`,
                        }).done(function( res ) {
                            table.ajax.reload();
                        });
                    }
                });
            });
        });
</script>
@endsection
