import { useState } from "react";
import { ChevronDown, ChevronUp, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface TocItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

const TableOfContents = ({ items, className }: TableOfContentsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setIsOpen(false);
  };

  if (items.length === 0) return null;

  return (
    <nav className={cn("my-8 rounded-lg border bg-card p-4", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-semibold"
      >
        <span className="flex items-center gap-2">
          <List className="h-5 w-5 text-primary" />
          {t("tableOfContents")}
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      
      {isOpen && (
        <ol className="mt-4 space-y-2 border-l-2 border-primary/20 pl-4">
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                onClick={() => handleClick(item.id)}
                className="flex items-start gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="font-medium text-primary/60">{index + 1}.</span>
                <span>{item.title}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
};

export default TableOfContents;
