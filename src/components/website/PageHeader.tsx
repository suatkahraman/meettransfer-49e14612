import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backTo?: { path: string; label: string };
}

const PageHeader = ({ title, subtitle, backgroundImage, backTo }: PageHeaderProps) => {
  return (
    <div
      className="relative bg-primary text-primary-foreground py-16 px-4"
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {backTo && (
        <div className="absolute top-4 left-4 z-10">
          <Link
            to={backTo.path}
            className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors text-sm"
          >
            <span className="inline-block">←</span>
            {backTo.label}
          </Link>
        </div>
      )}
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
        {subtitle && (
          <p className="text-lg md:text-xl opacity-90">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
