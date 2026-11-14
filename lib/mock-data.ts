import type { Annotation, Frame } from "@/types/domain";

export const frames: Frame[] = [
  {
    id: "frame-001",
    movie: "Doosra",
    frameImage: "/frames/doosra.jpeg",
    timecode: "00:18:42",
    director: "Channa Deshapriya",
    dop: "Dammika Rathnayake",
    sequence: 1,
    notes: "Research frame from Doosra."
  },
  {
    id: "frame-002",
    movie: "Paradise",
    frameImage: "/frames/paradise.jpeg",
    timecode: "00:46:15",
    director: "Prasanna Vithanage",
    dop: "Rajeev Ravi",
    sequence: 2,
    notes: "Research frame from Paradise."
  },
  {
    id: "frame-003",
    movie: "Oba Nathuwa Oba Ekka",
    frameImage: "/frames/obanathuwaobaekka.jpeg",
    timecode: "01:12:30",
    director: "Prasanna Vithanage",
    dop: "M.D. Mahindapala",
    sequence: 3,
    notes: "Research frame from Oba Nathuwa Oba Ekka."
  }
];

export const annotations = new Map<string, Annotation>();
