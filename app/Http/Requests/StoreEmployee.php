<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployee extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'employee_id' => 'required|unique:users,employee_id',
            'name' => 'required',
            'phone' => 'required|min:9|max:11|unique:users,phone',
            'email' => 'required|email|unique:users,email',
            'nrc_number' => 'required',
            'gender' => 'required',
            'birthday' => 'required',
            'address' => 'required',
            'department_id' => 'required',
            'date_of_join' => 'required',
            'is_present' => 'required',
            'pin_code' => 'required|min:6|max:6',
            'pin_code' => 'required|min:6|max:6|unique:users,pin_code',
            'password' => 'required',
        ];
    }
}
