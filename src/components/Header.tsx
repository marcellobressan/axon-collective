import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import useAuthStore from '@/store/authStore';
export function Header() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <BrainCircuit className="w-7 h-7 text-indigo-500" />
            <span className="text-xl font-bold font-display hidden sm:inline">Futures Wheel Hub</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="relative" />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}