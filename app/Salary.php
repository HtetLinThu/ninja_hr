<?php

namespace App;

use App\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Salary extends Model
{
    use HasFactory;

    protected $guarded = [];
    
    public function employee(){
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
