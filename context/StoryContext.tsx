"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
}

interface StoryContextType {
  form: StoryForm;
  setForm: React.Dispatch<React.SetStateAction<StoryForm>>;
  babyImage: string | null;
  setBabyImage: React.Dispatch<React.SetStateAction<string | null>>;
}

const INITIAL: StoryForm = {
  babyName: "", motherName: "", fatherName: "",
  birthDate: "", birthTime: "", firstCryTime: "",
  birthWeight: "", height: "", latitude: "", longitude: "",
  hospital: "", doctors: [], nurse: [],
  roomType: "", checkInDate: "", checkInTime: "",
  firstOutfit: "", motherOutfit: "", story: "",
  grandmother: "", grandfather: "", gender: "",
};

const StoryContext = createContext<StoryContextType | null>(null);

export function StoryProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<StoryForm>(INITIAL);
  const [babyImage, setBabyImage] = useState<string | null>(null);

  return (
    <StoryContext.Provider value={{ form, setForm, babyImage, setBabyImage }}>
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) throw new Error("useStory must be used inside StoryProvider");
  return context;
}
