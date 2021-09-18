@foreach ($biometrics as $biometric)
<a href="#" class="btn biometric-data">
    <i class="fas fa-fingerprint"></i>
    <p class="mb-0">Biometric {{$loop->iteration}}</p>
    <i class="fas fa-trash-alt biometric-delete-btn" data-id="{{$biometric->id}}"></i>
</a>
@endforeach
