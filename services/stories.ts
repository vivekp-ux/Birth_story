import { supabase } from "@/lib/supabase";
import { Story, PdfVersion, UserProfile } from "@/types/story";

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || "User",
      role: (user.user_metadata?.role as "ADMIN" | "STAFF") || "STAFF",
      created_at: user.created_at,
    };
  }

  if (!data) {
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.email || "User",
      role: (user.user_metadata?.role as "ADMIN" | "STAFF") || "STAFF",
      created_at: user.created_at,
    };
  }

  return data as UserProfile;
}


export async function fetchStories(options?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  hospital?: string;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const search = (options?.search ?? "").trim().toLowerCase();
  const status = options?.status ?? "All";

  // Fetch all stories (status-filtered) then apply search + pagination client-side.
  // This is necessary because doctor_names is a text[] column and PostgREST does not
  // support partial ilike matching on array elements.
  let query = supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "All") {
    query = query.eq("status", status);
  }

  if (options?.hospital) {
    query = query.eq("hospital", options.hospital);
  }

  const { data, error } = await query;
  if (error) throw error;

  let stories = (data as Story[]) ?? [];

  if (search) {
    stories = stories.filter((s) => {
      const doctors = (s.doctor_names || []).join(" ").toLowerCase();
      const nurses  = (s.nurse_names  || []).join(" ").toLowerCase();
      return (
        (s.baby_name    || "").toLowerCase().includes(search) ||
        (s.mother_name  || "").toLowerCase().includes(search) ||
        (s.father_name  || "").toLowerCase().includes(search) ||
        (s.hospital     || "").toLowerCase().includes(search) ||
        doctors.includes(search) ||
        nurses.includes(search)
      );
    });
  }

  const total      = stories.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from       = (page - 1) * limit;
  const paginated  = stories.slice(from, from + limit);

  return {
    stories: paginated,
    total,
    totalPages,
    page,
    limit,
  };
}

export async function fetchStoryStats(hospital?: string) {
  // Use a single GET query (fetching only the status column) instead of 6 parallel
  // HEAD requests — Supabase can return 502 for HEAD requests in some configurations.
  let query = supabase.from("stories").select("status");

  if (hospital) {
    query = query.eq("hospital", hospital);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as { status: string }[];

  const counts = { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0, completed: 0 };
  for (const row of rows) {
    counts.total++;
    switch (row.status) {
      case "Draft":            counts.draft++;     break;
      case "Pending Approval": counts.pending++;   break;
      case "Approved":         counts.approved++;  break;
      case "Rejected":         counts.rejected++;  break;
      case "Completed":        counts.completed++; break;
    }
  }

  return counts;
}

export async function fetchStoryById(id: string) {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Story;
}

export async function saveStory(story: Partial<Story>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const cleanedStory = { ...story };
  delete cleanedStory.created_at;
  delete cleanedStory.updated_at;
  
  if (story.id) {
    const { data, error } = await supabase
      .from("stories")
      .update(cleanedStory)
      .eq("id", story.id)
      .select()
      .single();
    if (error) throw error;
    return data as Story;
  } else {
    if (user) {
      // Only set created_by if the user profile exists in public.users
      // (avoids FK violation for accounts created before the trigger was set up)
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        cleanedStory.created_by = user.id;
      }
    }
    const { data, error } = await supabase
      .from("stories")
      .insert(cleanedStory)
      .select()
      .single();
    if (error) throw error;
    return data as Story;
  }
}

export async function deleteStory(id: string) {
  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadPhoto(storyId: string, file: File) {
  const fileExt = file.name.split(".").pop();
  const filePath = `story-${storyId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("baby-photos")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("baby-photos").getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("stories")
    .update({ photo_url: publicUrl })
    .eq("id", storyId);

  if (updateError) throw updateError;

  return publicUrl;
}

export async function uploadPdf(storyId: string, fileBlob: Blob) {
  const { data: versions, error: fetchError } = await supabase
    .from("pdf_versions")
    .select("version")
    .eq("story_id", storyId)
    .order("version", { ascending: false })
    .limit(1);

  if (fetchError) throw fetchError;

  const lastVersion = versions && versions.length > 0 ? versions[0].version : 0;
  const nextVersion = lastVersion + 1;
  const filePath = `story-${storyId}-v${nextVersion}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("story-pdfs")
    .upload(filePath, fileBlob, { 
      upsert: true,
      contentType: "application/pdf",
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("story-pdfs").getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  const { error: insertError } = await supabase
    .from("pdf_versions")
    .insert({
      story_id: storyId,
      version: nextVersion,
      pdf_url: publicUrl,
    });

  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("stories")
    .update({
      latest_pdf_url: publicUrl,
      status: "Completed",
    })
    .eq("id", storyId);

  if (updateError) throw updateError;

  return publicUrl;
}

export async function fetchPdfVersions(storyId: string) {
  const { data, error } = await supabase
    .from("pdf_versions")
    .select("*")
    .eq("story_id", storyId)
    .order("version", { ascending: false });

  if (error) throw error;
  return data as PdfVersion[];
}
