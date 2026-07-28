import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function answerLabel(answer: string) {
  if (answer === "NOT_SURE") return "Not Sure";
  return answer.charAt(0) + answer.slice(1).toLowerCase();
}
