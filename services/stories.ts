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

  // 🔍 DEBUG — open browser console to see this
  console.log("[getUserProfile] auth user id:", user.id);
  console.log("[getUserProfile] auth user email:", user.email);
  console.log("[getUserProfile] DB row:", data);
  console.log("[getUserProfile] DB error:", error);

  if (error) {
    console.warn("[getUserProfile] DB query failed — falling back to auth metadata (role may be wrong)");
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || "User",
      role: (user.user_metadata?.role as "ADMIN" | "STAFF") || "STAFF",
      created_at: user.created_at,
    };
  }

  if (!data) {
    console.warn("[getUserProfile] No row found in public.users for this user — falling back to auth metadata");
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


export async function fetchStories() {
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Story[];
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
