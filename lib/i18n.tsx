"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Lang = "en" | "si";

const en = {
  // Landing
  eyebrow: "Final year academic research · 2026",
  titleLine1: "Reading and Evaluating the Aesthetics of",
  titleLine2: "Unconventional Framing in Contemporary Sri Lankan Cinema",
  subtitle: "Sinhala Feature Films (2005 – 2026)",
  begin: "Begin the study",
  footerDegree: "Undergraduate of BSc (Hons) in Multimedia Technology",
  footerUni: "Kingston University London",

  // Details form
  back: "Back",
  beforeBegin: "Before we begin",
  createCard: "Create your card",
  createCardHint: "Add your photo, name and role. Your card updates live as you type.",
  yourPhoto: "Your photo",
  uploadPhoto: "Upload photo",
  changePhoto: "Change photo",
  useCamera: "Use camera",
  crop: "Crop",
  remove: "Remove",
  photoOptional: "Optional. You can also drop an image onto your card.",
  yourName: "Your name",
  namePlaceholder: "Type your name here",
  yourRole: "Your role",
  startStudy: "Start the study",
  saving: "Saving…",
  saveError: "Could not save your details. Please try again.",
  roleDirector: "Film Director",
  roleCinematographer: "Cinematographer",
  roleAcademic: "Academic / Lecturer",
  roleStudent: "Film Student /\nYoung Filmmaker",
  hintDirector: "Directs films or episodes",
  hintCinematographer: "Director of photography / camera",
  hintAcademic: "Teaches or researches film",
  hintStudent: "Studying film or making early work",

  // Camera + crop
  liveCamera: "Live camera",
  closeCamera: "Close camera",
  capture: "Capture",
  cancel: "Cancel",
  cameraError: "Camera access is blocked or unavailable.",
  cropTitle: "Crop your photo",
  cropHint: "Drag the frame to move it. Drag a corner to resize.",
  cropUse: "Crop & use",

  // Cards
  cardName: "Your name",
  addPhoto: "Add your photo",
  cardParticipant: "Participant",
  cardChooseRole: "Choose a role to style your card",
  cardStudentRole: "Student / Young Filmmaker",

  // Viewer
  ansUnconventional: "Unconventional",
  ansConventional: "Conventional",
  ansNotSure: "Not Sure",
  timecode: "timecode",
  frame: "Frame",
  director: "Director",
  dop: "DOP",
  saved: "saved",
  rated: "Rated",
  answerPrompt: "How would you describe this frame?",
  changeAnswer: "Change",
  thankLine1: "Thank you for giving your valuable time to my research,",
  thankLine2: "See you again!",
  downloadPdf: "Download my responses (PDF)",
  preparing: "Preparing…",
  reviewAnswers: "Review my answers",
  reviewTitle: "My answers",
  notAnswered: "Not answered",
  reportError: "Could not create the PDF. Please try again.",
  saveFailed: "Could not save. Please try again.",
  noFrames: "No frames to rate right now",
  noFramesHint: "Please check back in a little while.",
  showGuide: "Show the guide",
  thirds: "Rule of thirds overlay",
  fullscreen: "Fullscreen",
  prevFrame: "Previous frame",
  nextFrame: "Next frame",
  saveFrame: "Save frame",
  replayFrame: "Replay frame",

  // Tour
  tourStep: "Step",
  tourOf: "of",
  skip: "Skip",
  next: "Next",
  startRating: "Start rating",
  tour1Title: "This is the frame",
  tour1Body: "Look at the picture first, in full. Click anywhere or press any key to show or hide the movie details.",
  tour2Title: "Movie details",
  tour2Body: "The film, timecode, director and cinematographer appear here, along with your progress through the frames.",
  tour3Title: "Give your answer",
  tour3Body:
    "First choose Unconventional, Conventional or Not Sure. Then pick a number from 1 to 5 under it. Shortcut keys: 1 to 3, then 1 to 5. Your answer is saved and the next frame opens.",
  tour4Title: "Move between frames",
  tour4Body: "Use the arrows, or the left and right arrow keys, to go back or skip ahead.",
  tour5Title: "Helpful tools",
  tour5Body: "Switch the language, show a rule-of-thirds grid, go fullscreen, or reopen this guide any time with the ? button."
};

export type Key = keyof typeof en;

const si: Record<Key, string> = {
  eyebrow: "අවසන් වසර ශාස්ත්‍රීය පර්යේෂණය · 2026",
  titleLine1: "සමකාලීන ශ්‍රී ලාංකීය සිනමාවේ සාම්ප්‍රදායික නොවන රාමුකරණයේ",
  titleLine2: "සෞන්දර්යය කියවීම සහ ඇගයීම",
  subtitle: "සිංහල චිත්‍රපට (2005 – 2026)",
  begin: "අධ්‍යයනය ආරම්භ කරන්න",
  footerDegree: "බහුමාධ්‍ය තාක්ෂණය පිළිබඳ විද්‍යාවේදී (විශේෂ) උපාධි අපේක්ෂක",
  footerUni: "කිංස්ටන් විශ්ව විද්‍යාලය, ලන්ඩන්",

  back: "ආපසු",
  beforeBegin: "ආරම්භ කිරීමට පෙර",
  createCard: "ඔබේ කාඩ්පත සාදන්න",
  createCardHint: "ඔබේ ඡායාරූපය, නම සහ භූමිකාව එක් කරන්න. ඔබ ටයිප් කරන විට කාඩ්පත සජීවීව යාවත්කාලීන වේ.",
  yourPhoto: "ඔබේ ඡායාරූපය",
  uploadPhoto: "ඡායාරූපය උඩුගත කරන්න",
  changePhoto: "ඡායාරූපය වෙනස් කරන්න",
  useCamera: "කැමරාව භාවිතා කරන්න",
  crop: "කපන්න",
  remove: "ඉවත් කරන්න",
  photoOptional: "විකල්පයි. ඔබට රූපයක් කාඩ්පතට ඇද දමා ද හැක.",
  yourName: "ඔබේ නම",
  namePlaceholder: "ඔබේ නම මෙහි ටයිප් කරන්න",
  yourRole: "ඔබේ භූමිකාව",
  startStudy: "අධ්‍යයනය ආරම්භ කරන්න",
  saving: "සුරකිමින්…",
  saveError: "ඔබේ තොරතුරු සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
  roleDirector: "චිත්‍රපට අධ්‍යක්ෂක",
  roleCinematographer: "සිනමාකරු (කැමරා අධ්‍යක්ෂ)",
  roleAcademic: "ශාස්ත්‍රඥ / කථිකාචාර්ය",
  roleStudent: "චිත්‍රපට සිසුවා /\nතරුණ චිත්‍රපට නිර්මාතෘ",
  hintDirector: "චිත්‍රපට හෝ කථාංග අධ්‍යක්ෂණය කරයි",
  hintCinematographer: "කැමරා අධ්‍යක්ෂ / කැමරාව",
  hintAcademic: "චිත්‍රපට උගන්වයි හෝ පර්යේෂණ කරයි",
  hintStudent: "චිත්‍රපට හදාරයි හෝ මුල් නිර්මාණ කරයි",

  liveCamera: "සජීවී කැමරාව",
  closeCamera: "කැමරාව වසන්න",
  capture: "ඡායාරූපය ගන්න",
  cancel: "අවලංගු කරන්න",
  cameraError: "කැමරාවට ප්‍රවේශය අවහිර කර ඇත හෝ නොමැත.",
  cropTitle: "ඡායාරූපය කපන්න",
  cropHint: "රාමුව ගෙන යාමට ඇදගන්න. ප්‍රමාණය වෙනස් කිරීමට කෙළවරක් ඇදගන්න.",
  cropUse: "කපා භාවිතා කරන්න",

  cardName: "ඔබේ නම",
  addPhoto: "ඡායාරූපයක් එක් කරන්න",
  cardParticipant: "සහභාගිකයා",
  cardChooseRole: "කාඩ්පත සැරසීමට භූමිකාවක් තෝරන්න",
  cardStudentRole: "සිසුවා / තරුණ චිත්‍රපට නිර්මාතෘ",

  ansUnconventional: "සාම්ප්‍රදායික නොවන",
  ansConventional: "සාම්ප්‍රදායික",
  ansNotSure: "විශ්වාස නැත",
  timecode: "කාලකේතය",
  frame: "රාමුව",
  director: "අධ්‍යක්ෂ",
  dop: "කැමරා අධ්‍යක්ෂ",
  saved: "සුරැකිණි",
  rated: "ඇගයුම",
  answerPrompt: "මෙම රාමුව ඔබ කෙසේ විස්තර කරන්නේද?",
  changeAnswer: "වෙනස් කරන්න",
  thankLine1: "ස්තූතියි ඔබේ වටිනා කාලය මගේ පර්යේෂණය වෙනුවෙන් ලබා දුන්නාට,",
  thankLine2: "අපි නැවත හමුවෙමු!",
  downloadPdf: "මගේ පිළිතුරු PDF ලෙස බාගන්න",
  preparing: "සකසමින්…",
  reviewAnswers: "මගේ පිළිතුරු නැවත බලන්න",
  reviewTitle: "මගේ පිළිතුරු",
  notAnswered: "පිළිතුරු දී නැත",
  reportError: "PDF සෑදීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
  saveFailed: "සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
  noFrames: "දැනට ඇගයීමට රාමු නොමැත",
  noFramesHint: "කරුණාකර මද වේලාවකින් නැවත පරීක්ෂා කරන්න.",
  showGuide: "මාර්ගෝපදේශය පෙන්වන්න",
  thirds: "තුනෙන් එකේ නීති ජාලකය",
  fullscreen: "පූර්ණ තිරය",
  prevFrame: "කලින් රාමුව",
  nextFrame: "ඊළඟ රාමුව",
  saveFrame: "රාමුව සුරකින්න",
  replayFrame: "රාමුව නැවත පෙන්වන්න",

  tourStep: "පියවර",
  tourOf: "/",
  skip: "මඟ හරින්න",
  next: "ඊළඟ",
  startRating: "ඇගයීම ආරම්භ කරන්න",
  tour1Title: "මෙය රාමුවයි",
  tour1Body: "මුලින්ම පින්තූරය සම්පූර්ණයෙන් බලන්න. චිත්‍රපට විස්තර පෙන්වීමට හෝ සැඟවීමට ඕනෑම තැනක ක්ලික් කරන්න හෝ ඕනෑම යතුරක් ඔබන්න.",
  tour2Title: "චිත්‍රපට විස්තර",
  tour2Body: "චිත්‍රපටය, කාලකේතය, අධ්‍යක්ෂක සහ කැමරා අධ්‍යක්ෂ මෙහි පෙනේ. ඔබේ ප්‍රගතියද මෙහි දැක්වේ.",
  tour3Title: "ඔබේ පිළිතුර දෙන්න",
  tour3Body:
    "මුලින් සාම්ප්‍රදායික නොවන, සාම්ප්‍රදායික හෝ විශ්වාස නැත යන්නෙන් එකක් තෝරන්න. ඉන්පසු එයට පහළින් 1 සිට 5 දක්වා අංකයක් තෝරන්න. කෙටි යතුරු: පළමුව 1 සිට 3 දක්වා, ඉන්පසු 1 සිට 5 දක්වා. ඔබේ පිළිතුර සුරැකී ඊළඟ රාමුව විවෘත වේ.",
  tour4Title: "රාමු අතර ගමන් කරන්න",
  tour4Body: "ඊතල බොත්තම් හෝ වම් සහ දකුණු ඊතල යතුරු භාවිතා කර ආපසු යන්න හෝ ඉදිරියට යන්න.",
  tour5Title: "ප්‍රයෝජනවත් මෙවලම්",
  tour5Body: "භාෂාව මාරු කරන්න, තුනෙන් එකේ ජාලකය පෙන්වන්න, පූර්ණ තිරයට යන්න, හෝ ? බොත්තමෙන් මෙම මාර්ගෝපදේශය නැවත විවෘත කරන්න."
};

const dictionary: Record<Lang, Record<Key, string>> = { en, si };

type Ctx = { lang: Lang; setLang: (lang: Lang) => void; t: (key: Key) => string };

const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (key) => en[key] });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Restore the saved choice after mount, so server and client markup match on first render.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lang");
      if (saved === "si" || saved === "en") setLangState(saved);
    } catch {
      // Storage can be unavailable; English is the default.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "si" ? "si" : "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem("lang", next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (key) => dictionary[lang][key] }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

/** Small English / Sinhala switch for the top-right corner. */
export function LanguageSwitch({ className, inline = false }: { className?: string; inline?: boolean }) {
  const { lang, setLang } = useLang();
  const option = (value: Lang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      className={cn(
        "rounded-full text-sm transition",
        inline ? "h-9 px-3" : "px-3.5 py-1.5",
        lang === value ? "bg-white text-black" : "text-zinc-300 hover:text-white"
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-white/15 bg-black/60 p-0.5 backdrop-blur",
        !inline && "fixed right-4 top-4 z-40 p-1 sm:right-6 sm:top-6",
        className
      )}
    >
      {option("en", "EN")}
      {option("si", "සිං")}
    </div>
  );
}
