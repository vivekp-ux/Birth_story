export interface Story {
  id?: string;
  baby_name: string;
  gender: "male" | "female" | "";
  birth_date: string;
  birth_time: string;
  birth_weight: string;
  height: string;
  first_cry_time: string;
  latitude: string;
  longitude: string;
  hospital: string;

  // Family details
  mother_name: string;
  father_name: string;
  maternal_grandmother: string;
  maternal_grandfather: string;
  paternal_grandmother: string;
  paternal_grandfather: string;
  other_family: string;

  // Hospital details
  room_type: string;
  checkin_date: string;
  checkin_time: string;

  // Medical team arrays
  doctor_names: string[];
  nurse_names: string[];

  // First moments
  baby_first_outfit: string;
  mother_outfit: string;
  first_feed: string;

  // Assets & status
  photo_url: string | null;
  latest_pdf_url: string | null;
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Completed" | "Archived";
  rejection_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  submitted_at?: string | null;

  // Metadata
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PdfVersion {
  id: string;
  story_id: string;
  version: number;
  pdf_url: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "APPROVER";
  assigned_centre?: string | null;
  created_at: string;
}
