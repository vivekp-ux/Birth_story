"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Story } from "@/types/story";
import { saveStory, fetchStoryById, uploadPhoto } from "@/services/stories";

export interface StoryForm {
  id?: string;
  babyName: string;
  motherName: string;
  fatherName: string;
  birthDate: string;
  birthTime: string;
  firstCryTime: string;
  birthWeight: string;
  height: string;
  latitude: string;
  longitude: string;
  hospital: string;
  doctors: string[];
  nurse: string[];
  roomType: string;
  checkInDate: string;
  checkInTime: string;
  firstOutfit: string;
  motherOutfit: string;
  story: string;
  grandmother: string;
  grandfather: string;
  maternalGrandmother: string;
  maternalGrandfather: string;
  paternalGrandmother: string;
  paternalGrandfather: string;
  otherFamily: string;
  gender: "male" | "female" | "";
  storyImage: string | null;
  photo_url?: string | null;
  latest_pdf_url?: string | null;
  status?: "Draft" | "Completed" | "Archived";
}

interface StoryContextType {
  form: StoryForm;
  setForm: React.Dispatch<React.SetStateAction<StoryForm>>;
  babyImage: string | null;
  setBabyImage: React.Dispatch<React.SetStateAction<string | null>>;
  saveDraft: () => Promise<string | null>;
  clearDraft: () => void;
  draftSaved: boolean;
  storyId: string | null;
  setStoryId: (id: string | null) => void;
  loadStoryFromDb: (id: string) => Promise<void>;
  saveStoryToDb: (status: "Draft" | "Completed" | "Archived") => Promise<string>;
  loading: boolean;
  validationError: string | null;
  clearValidationError: () => void;
  validateDraftFields: () => string | null;
}

const INITIAL: StoryForm = {
  babyName: "", motherName: "", fatherName: "",
  birthDate: "", birthTime: "", firstCryTime: "",
  birthWeight: "", height: "", latitude: "", longitude: "",
  hospital: "", doctors: [], nurse: [],
  roomType: "", checkInDate: "", checkInTime: "",
  firstOutfit: "", motherOutfit: "", story: "",
  grandmother: "", grandfather: "",
  maternalGrandmother: "", maternalGrandfather: "",
  paternalGrandmother: "", paternalGrandfather: "",
  otherFamily: "", gender: "", storyImage: null,
  status: "Draft",
};

const DRAFT_KEY = "ovum_story_draft";

const StoryContext = createContext<StoryContextType | null>(null);

export function StoryProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<StoryForm>(INITIAL);
  const [babyImage, setBabyImage] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [storyId, setStoryIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const clearValidationError = () => setValidationError(null);

  // Validates that minimum required fields are filled for a draft save
  const validateDraftFields = (): string | null => {
    const missing: string[] = [];
    if (!form.babyName.trim()) missing.push("Baby Name");
    if (!form.motherName.trim()) missing.push("Mother Name");
    if (!form.hospital.trim()) missing.push("Hospital");
    if (!form.doctors || form.doctors.length === 0) missing.push("at least one Doctor");
    if (missing.length > 0) {
      return `Please enter ${missing.join(", ")} before saving.`;
    }
    return null;
  };

  const setStoryId = (id: string | null) => {
    setStoryIdState(id);
    if (!id) {
      setForm(INITIAL);
      setBabyImage(null);
    }
  };

  // Maps UI form state to Database schema representation
  const toDbStory = (formState: StoryForm): Partial<Story> => {
    return {
      baby_name: formState.babyName,
      gender: formState.gender || undefined,
      birth_date: formState.birthDate || undefined,
      birth_time: formState.birthTime,
      birth_weight: formState.birthWeight ? formState.birthWeight : undefined,
      height: formState.height ? formState.height : undefined,
      first_cry_time: formState.firstCryTime,
      latitude: formState.latitude,
      longitude: formState.longitude,
      hospital: formState.hospital,
      mother_name: formState.motherName,
      father_name: formState.fatherName,
      maternal_grandmother: formState.maternalGrandmother,
      maternal_grandfather: formState.maternalGrandfather,
      paternal_grandmother: formState.paternalGrandmother,
      paternal_grandfather: formState.paternalGrandfather,
      other_family: formState.otherFamily,
      room_type: formState.roomType,
      checkin_date: formState.checkInDate || undefined,
      checkin_time: formState.checkInTime,
      doctor_names: formState.doctors,
      nurse_names: formState.nurse,
      baby_first_outfit: formState.firstOutfit,
      mother_outfit: formState.motherOutfit,
      first_feed: formState.firstCryTime,
      status: formState.status || "Draft",
      photo_url: formState.photo_url || null,
      latest_pdf_url: formState.latest_pdf_url || null,
    };
  };

  // Maps Database schema representation to UI form state
  const toClientForm = (dbStory: Story): StoryForm => {
    return {
      id: dbStory.id,
      babyName: dbStory.baby_name || "",
      motherName: dbStory.mother_name || "",
      fatherName: dbStory.father_name || "",
      gender: dbStory.gender || "",
      birthDate: dbStory.birth_date || "",
      birthTime: dbStory.birth_time || "",
      firstCryTime: dbStory.first_cry_time || "",
      birthWeight: dbStory.birth_weight ? String(dbStory.birth_weight) : "",
      height: dbStory.height ? String(dbStory.height) : "",
      latitude: dbStory.latitude || "",
      longitude: dbStory.longitude || "",
      hospital: dbStory.hospital || "",
      doctors: dbStory.doctor_names || [],
      nurse: dbStory.nurse_names || [],
      roomType: dbStory.room_type || "",
      checkInDate: dbStory.checkin_date || "",
      checkInTime: dbStory.checkin_time || "",
      firstOutfit: dbStory.baby_first_outfit || "",
      motherOutfit: dbStory.mother_outfit || "",
      story: "",
      grandmother: "",
      grandfather: "",
      maternalGrandmother: dbStory.maternal_grandmother || "",
      maternalGrandfather: dbStory.maternal_grandfather || "",
      paternalGrandmother: dbStory.paternal_grandmother || "",
      paternalGrandfather: dbStory.paternal_grandfather || "",
      otherFamily: dbStory.other_family || "",
      storyImage: dbStory.photo_url || null,
      photo_url: dbStory.photo_url || null,
      latest_pdf_url: dbStory.latest_pdf_url || null,
      status: dbStory.status || "Draft",
    };
  };

  // Load draft from localStorage on mount as secondary option if not logged in
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved && !storyId) {
        const { form: savedForm, babyImage: savedImage } = JSON.parse(saved);
        if (savedForm) setForm({ ...INITIAL, ...savedForm });
        if (savedImage) setBabyImage(savedImage);
      }
    } catch {
      // ignore parse errors
    }
  }, [storyId]);

  const loadStoryFromDb = async (id: string) => {
    setLoading(true);
    try {
      const dbStory = await fetchStoryById(id);
      const clientForm = toClientForm(dbStory);
      setForm(clientForm);
      setStoryIdState(id);
      setBabyImage(dbStory.photo_url || null);
    } catch (error) {
      console.error("Error loading story from DB:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert base64 data to Blob
  const base64ToBlob = async (base64Data: string): Promise<Blob> => {
    const res = await fetch(base64Data);
    return await res.blob();
  };

  const saveStoryToDb = async (status: "Draft" | "Completed" | "Archived"): Promise<string> => {
    // Validate minimum required fields before ANY database save
    const error = validateDraftFields();
    if (error) {
      setValidationError(error);
      throw new Error(error);
    }
    setValidationError(null);

    setLoading(true);
    try {
      const updatedForm = { ...form, status };
      const dbData = toDbStory(updatedForm);
      
      if (storyId) {
        dbData.id = storyId;
      }
      
      // Save story metadata first
      const savedStory = await saveStory(dbData);
      const id = savedStory.id!;
      
      setStoryIdState(id);
      setForm((f) => ({ ...f, id, status }));
      
      // If there is a new baby photo selected locally (base64)
      if (babyImage && babyImage.startsWith("data:image")) {
        const blob = await base64ToBlob(babyImage);
        const ext = blob.type.split("/")[1] || "jpg";
        const file = new File([blob], `story-${id}.${ext}`, { type: blob.type });
        const uploadedUrl = await uploadPhoto(id, file);
        setBabyImage(uploadedUrl);
        setForm((f) => ({ ...f, photo_url: uploadedUrl }));
      }
      
      return id;
    } catch (error) {
      console.error("Error saving story to DB:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (): Promise<string | null> => {
    // Validate minimum required fields before saving draft
    const error = validateDraftFields();
    if (error) {
      setValidationError(error);
      return null;
    }
    setValidationError(null);

    try {
      // 1. Try saving to Supabase first if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const id = await saveStoryToDb("Draft");
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2500);
        return id;
      }
      
      // 2. Fallback to localStorage if offline / not logged in
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, babyImage }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
      return null;
    } catch (error) {
      console.error("Failed to save draft:", error);
      return null;
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setForm(INITIAL);
      setBabyImage(null);
      setStoryIdState(null);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <StoryContext.Provider
      value={{
        form,
        setForm,
        babyImage,
        setBabyImage,
        saveDraft,
        clearDraft,
        draftSaved,
        storyId,
        setStoryId,
        loadStoryFromDb,
        saveStoryToDb,
        loading,
        validationError,
        clearValidationError,
        validateDraftFields,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) throw new Error("useStory must be used inside StoryProvider");
  return context;
}
