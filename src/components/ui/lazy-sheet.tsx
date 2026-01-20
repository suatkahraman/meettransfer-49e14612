import * as React from "react";
import { Skeleton } from "./skeleton";

// Fallback for when sheet is loading
const SheetFallback = () => (
  <div className="fixed inset-0 z-50 bg-black/80">
    <div className="fixed inset-y-0 right-0 h-full w-3/4 sm:max-w-sm bg-background p-6 shadow-lg">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

interface LazySheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  modal?: boolean;
}

// Lazy loaded Sheet that only loads Radix when opened
export const LazySheet: React.FC<LazySheetProps> = ({ 
  open, 
  onOpenChange, 
  children,
  ...props 
}) => {
  const [SheetModule, setSheetModule] = React.useState<typeof import("./sheet") | null>(null);

  React.useEffect(() => {
    if (open && !SheetModule) {
      import("./sheet").then(setSheetModule);
    }
  }, [open, SheetModule]);

  if (!SheetModule) {
    return open ? <SheetFallback /> : null;
  }

  const { Sheet } = SheetModule;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </Sheet>
  );
};

LazySheet.displayName = "LazySheet";

// Re-export other parts for convenience
export {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
