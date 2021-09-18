@extends('layouts.app')
@section('title', 'Projects')
@section('content')
<div>
    @can('create_project')
    <a href="{{route('project.create')}}" class="btn btn-theme btn-sm"><i class="fas fa-plus-circle"></i> Create
        Project</a>
    @endcan
</div>
<div class="card">
    <div class="card-body">
        <table class="table table-bordered Datatable" style="width:100%;">
            <thead>
                <th class="text-center no-sort no-search"></th>
                <th class="text-center">Title</th>
                <th class="text-center">Description</th>
                <th class="text-center no-sort">Leaders</th>
                <th class="text-center no-sort">Members</th>
                <th class="text-center">Start Date</th>
                <th class="text-center">Deadline</th>
                <th class="text-center">Priority</th>
                <th class="text-center">Status</th>
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
                ajax: '/project/datatable/ssd',
                columns: [
                    { data: 'plus-icon', name: 'plus-icon', class: 'text-center' },
                    { data: 'title', name: 'title', class: 'text-center' },
                    { data: 'description', name: 'description', class: 'text-center' },
                    { data: 'leaders', name: 'leaders', class: 'text-center' },
                    { data: 'members', name: 'members', class: 'text-center' },
                    { data: 'start_date', name: 'start_date', class: 'text-center' },
                    { data: 'deadline', name: 'deadline', class: 'text-center' },
                    { data: 'priority', name: 'priority', class: 'text-center' },
                    { data: 'status', name: 'status', class: 'text-center' },
                    { data: 'action', name: 'action', class: 'text-center' },
                    { data: 'updated_at', name: 'updated_at', class: 'text-center' },
                ],
                order: [[ 10, "desc" ]],
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
                            url: `/project/${id}`,
                        }).done(function( res ) {
                            table.ajax.reload();
                        });
                    }
                });
            });
        });
</script>
@endsection
