export interface School {
  id: number;
  name: string;
  registration_number: string;
  email: string;
  phone_number: string;
  address: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSchoolDto {
  name: string;
  registration_number: string;
  email: string;
  phone_number: string;
  address: string;
  website?: string;
}

export interface UpdateSchoolDto extends Partial<CreateSchoolDto> {
  is_active?: boolean;
}

export interface SchoolsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: School[];
} 