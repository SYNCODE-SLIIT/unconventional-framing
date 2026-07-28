import type { Annotation, Frame, Statistics } from "@/types/domain";

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

export function calculateStatistics(): Statistics {
  const totalFrames = frames.length;
  const annotationList = [...annotations.values()];
  const totalAnnotations = annotationList.length;
  const byAnswer = annotationList.reduce(
    (acc, annotation) => {
      acc[annotation.answer] += 1;
      return acc;
    },
    { CONVENTIONAL: 0, UNCONVENTIONAL: 0, NOT_SURE: 0 }
  );

  const percent = (value: number) =>
    totalAnnotations === 0 ? 0 : Math.round((value / totalAnnotations) * 100);

  return {
    totalFrames,
    totalAnnotations,
    completionPercent:
      totalFrames === 0 ? 0 : Math.round((totalAnnotations / totalFrames) * 100),
    conventionalPercent: percent(byAnswer.CONVENTIONAL),
    unconventionalPercent: percent(byAnswer.UNCONVENTIONAL),
    notSurePercent: percent(byAnswer.NOT_SURE),
    movies: [...new Set(frames.map((frame) => frame.movie))].map((movie) => {
      const movieFrames = frames.filter((frame) => frame.movie === movie);
      const movieAnnotations = annotationList.filter((annotation) =>
        movieFrames.some((frame) => frame.id === annotation.frameId)
      );

      return {
        movie,
        frames: movieFrames.length,
        annotations: movieAnnotations.length,
        conventional: movieAnnotations.filter((item) => item.answer === "CONVENTIONAL").length,
        unconventional: movieAnnotations.filter((item) => item.answer === "UNCONVENTIONAL").length,
        notSure: movieAnnotations.filter((item) => item.answer === "NOT_SURE").length
      };
    })
  };
}

