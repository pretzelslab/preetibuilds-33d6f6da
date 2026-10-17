// Shared disparate-impact thresholds for the fairness pages.
// The EU AI Act sets no numeric disparity threshold. 1.25x is the inverse of the
// 0.80 four-fifths cutoff, used here as a screening flag.
export const DIR_THRESHOLD = 1.25;
export const DIR_FLOOR = 0.8;
export const DIR_THRESHOLD_LABEL = "4/5ths rule (US EEOC guidelines)";
export const DIR_THRESHOLD_NOTE =
  "The EU AI Act sets no numeric disparity threshold. 1.25× is the inverse of the 0.80 four-fifths cutoff, used here as a screening flag.";
