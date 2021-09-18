<?php

namespace App;

use App\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function members(){
        return $this->belongsToMany(User::class, 'task_members', 'task_id', 'user_id');
    }
}
