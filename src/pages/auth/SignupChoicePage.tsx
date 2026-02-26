import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SignupChoicePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="bg-black border-b border-white/10 h-16 flex items-center px-4">
        <Link to="/" className="text-white flex items-center gap-2 hover:text-accent transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Geri Dön</span>
        </Link>
      </header>
      <div className="flex-1 w-full overflow-hidden bg-white">
        <iframe 
          src="https://meettransfer.com/signup" 
          className="w-full h-full border-none" 
          title="Sign Up"
          style={{ minHeight: "calc(100vh - 64px)" }}
        />
      </div>
    </div>
  );
};

export default SignupChoicePage;
