export interface Profile {
  id: number;
  user_id: number;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  experience_years: number;
  target_roles: string[];
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field_of_study?: string;
    start_year?: number;
    end_year?: number;
  }>;
  experience: Array<{
    company: string;
    role: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    url?: string;
    technologies?: string[];
  }>;
  work_authorization: {
    authorized_in_us?: boolean;
    requires_sponsorship?: boolean;
    work_visa_status?: string;
    [key: string]: any;
  };
  application_answers: Record<string, string>;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  preferences: {
    locations?: string[];
    remote?: boolean;
    employment_types?: string[];
    minimum_salary?: number | null;
  };
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  profile?: Profile | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  database: string;
  timestamp: string;
}

export interface NormalizedJob {
  id?: string;
  title: string;
  company: string;
  description: string;
  location: string;
  remote: boolean;
  employment_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  url: string;
  source: string;
  external_id?: string | null;
  posted_at?: string | null;
  discovered_at: string;
  tags?: string[];
}

export interface MatchScore {
  overall_score: number;
  skill_match: number;
  experience_match: number;
  location_match: number;
  matched_skills: string[];
  missing_requirements: string[];
  reasoning: string;
}

export type ApplicationStatus =
  | "DISCOVERED"
  | "SAVED"
  | "REVIEW"
  | "READY"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";
