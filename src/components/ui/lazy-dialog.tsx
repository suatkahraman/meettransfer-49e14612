import * as React from "react";
import { Skeleton } from "./skeleton";

// Fallback for when dialog is loading
const DialogFallback = () => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
    <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-lg">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

interface LazyDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  modal?: boolean;
}

// Lazy loaded Dialog that only loads Radix when opened
export const LazyDialog: React.FC<LazyDialogProps> = ({ 
  open, 
  onOpenChange, 
  children,
  ...props 
}) => {
  const [DialogModule, setDialogModule] = React.useState<typeof import("./dialog") | null>(null);

  React.useEffect(() => {
    // Preload when opened
    if (open && !DialogModule) {
      import("./dialog").then(setDialogModule);
    }
  }, [open, DialogModule]);

  // Don't render anything if closed and not yet loaded
  if (!DialogModule) {
    return open ? <DialogFallback /> : null;
  }

  const { Dialog } = DialogModule;
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </Dialog>
  );
};

LazyDialog.displayName = "LazyDialog";

// Re-export other dialog parts for convenience
export {
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";
