<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Attendance</title>
    <style>
        body {
            padding: 30px;
            font-size: 14px;
            color: #333;
        }

        table {
            border-collapse: collapse;
        }

        .table {
            width: 100%;
            margin-bottom: 1rem;
            color: #212529;
        }

        .table thead th {
            vertical-align: bottom;
            border-bottom: 2px solid #dee2e6;
        }

        .table td,
        .table th {
            padding: 0.75rem;
            vertical-align: top;
            border-top: 1px solid #dee2e6;
        }

        .table-bordered {
            border: 1px solid #dee2e6;
        }

        .table-bordered thead td,
        .table-bordered thead th {
            border-bottom-width: 2px;
        }

        .table-bordered td,
        .table-bordered th {
            border: 1px solid #dee2e6;
        }

        .text-center {
            text-align: center;
        }
    </style>
</head>

<body>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th class="text-center">Name</th>
                <th class="text-center">Date</th>
                <th class="text-center">Checkin Time</th>
                <th class="text-center">Checkout Time</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($attendances as $attendance)
            <tr>
                <td class="text-center">{{optional($attendance->employee)->name}}</td>
                <td class="text-center">{{$attendance->date}}</td>
                <td class="text-center">{{$attendance->checkin_time}}</td>
                <td class="text-center">{{$attendance->checkout_time}}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>
