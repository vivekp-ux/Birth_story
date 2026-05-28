"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface StoryForm {
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
  gender: "male" | "female" | "";
  storyImage: string | null;
}

interface StoryContextType {
  form: StoryForm;
  setForm: React.Dispatch<React.SetStateAction<StoryForm>>;
  babyImage: string | null;
  setBabyImage: React.Dispatch<React.SetStateAction<string | null>>;
  saveDraft: () => void;
  clearDraft: () => void;
  draftSaved: boolean;
}

const INITIAL: StoryForm = {
  babyName: "", motherName: "", fatherName: "",
  birthDate: "", birthTime: "", firstCryTime: "",
  birthWeight: "", height: "", latitude: "", longitude: "",
  hospital: "", doctors: [], nurse: [],
  roomType: "", checkInDate: "", checkInTime: "",
  firstOutfit: "", motherOutfit: "", story: "",
  grandmother: "", grandfather: "", gender: "", storyImage: null,
};

const DRAFT_KEY = "ovum_story_draft";

const StoryContext = createContext<StoryContextType | null>(null);

export function StoryProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<StoryForm>(INITIAL);
  const [babyImage, setBabyImage] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const { form: savedForm, babyImage: savedImage } = JSON.parse(saved);
        if (savedForm) setForm({ ...INITIAL, ...savedForm });
        if (savedImage) setBabyImage(savedImage);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, babyImage }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch {
      // ignore storage errors
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setForm(INITIAL);
      setBabyImage(null);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <StoryContext.Provider value={{ form, setForm, babyImage, setBabyImage, saveDraft, clearDraft, draftSaved }}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) throw new Error("useStory must be used inside StoryProvider");
  return context;
}
