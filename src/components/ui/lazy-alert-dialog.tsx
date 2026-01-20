import * as React from "react";
import { Skeleton } from "./skeleton";

// Fallback for when alert dialog is loading
const AlertDialogFallback = () => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
    <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-lg">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <div className="flex gap-2 mt-4 justify-end">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  </div>
);

interface LazyAlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

// Lazy loaded AlertDialog that only loads Radix when opened
export const LazyAlertDialog: React.FC<LazyAlertDialogProps> = ({ 
  open, 
  onOpenChange, 
  children,
  ...props 
}) => {
  const [AlertDialogModule, setAlertDialogModule] = React.useState<typeof import("./alert-dialog") | null>(null);

  React.useEffect(() => {
    if (open && !AlertDialogModule) {
      import("./alert-dialog").then(setAlertDialogModule);
    }
  }, [open, AlertDialogModule]);

  if (!AlertDialogModule) {
    return open ? <AlertDialogFallback /> : null;
  }

  const { AlertDialog } = AlertDialogModule;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </AlertDialog>
  );
};

LazyAlertDialog.displayName = "LazyAlertDialog";

// Re-export other parts for convenience
export {
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";
