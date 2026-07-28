export type AnnotationAnswer = "UNCONVENTIONAL" | "CONVENTIONAL" | "NOT_SURE";

export type Frame = {
  id: string;
  movie: string;
  frameImage: string;
  timecode: string;
  director: string;
  dop: string;
  sequence: number;
  notes?: string;
};

export type Annotation = {
  frameId: string;
  answer: AnnotationAnswer;
  notes?: string;
  timestamp: string;
};

export type Statistics = {
  totalFrames: number;
  totalAnnotations: number;
  completionPercent: number;
  conventionalPercent: number;
  unconventionalPercent: number;
  notSurePercent: number;
  movies: Array<{
    movie: string;
    frames: number;
    annotations: number;
    conventional: number;
    unconventional: number;
    notSure: number;
  }>;
};
