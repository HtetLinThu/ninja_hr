<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanySetting extends FormRequest
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
            'company_name' => 'required',
            'company_phone' => 'required',
            'company_email' => 'required',
            'company_address' => 'required',
            'office_start_time' => 'required',
            'office_end_time' => 'required',
            'break_start_time' => 'required',
            'break_end_time' => 'required',
        ];
    }
}
