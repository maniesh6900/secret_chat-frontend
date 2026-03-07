import type { Toast } from "../types/chat";

type ToastStackProps = {
  toasts: Toast[];
};

export default function ToastStack({ toasts }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
