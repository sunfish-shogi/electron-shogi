export type Confirmation = {
  message: string;
  onOk: () => void;
  onCancel?: () => void;
};
