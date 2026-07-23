export type SharedSelectOption = {
  value: string;
  label: string;
};

export const hpStateOptions: SharedSelectOption[] = [
  { value: "below50", label: "低于 50%" },
  { value: "above50", label: "不低于 50%" },
];
