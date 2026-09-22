import { toast } from "@/components/ui/toast";

type ToastType = "success" | "info" | "warning" | "error" | "loading";

export function showToast(message: string, type: ToastType, ...info: any[]) {
  toast.add({
    title: message,
    type,
  });
}
