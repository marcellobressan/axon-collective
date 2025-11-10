import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WheelCanvas } from '@/components/WheelCanvas';
import useWheelStore from '@/store/wheelStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
export function WheelPage() {
  const { wheelId } = useParams<{ wheelId: string }>();
  const fetchWheel = useWheelStore((s) => s.fetchWheel);
  const title = useWheelStore((s) => s.title);
  const isLoading = useWheelStore((s) => s.isLoading);
  useEffect(() => {
    if (wheelId) {
      fetchWheel(wheelId);
      const intervalId = setInterval(() => {
        fetchWheel(wheelId);
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [wheelId, fetchWheel]);
  return (
    <div className="h-screen w-screen flex flex-col bg-muted/30">
      <header className="flex items-center p-4 border-b bg-background shadow-sm z-10">
        <Button asChild variant="ghost" size="icon">
            <Link to="/">
                <ArrowLeft className="w-5 h-5" />
            </Link>
        </Button>
        <div className="w-px h-6 bg-border mx-4" />
        <h1 className="text-xl font-semibold text-foreground">
          {isLoading ? 'Loading...' : title}
        </h1>
        <div className="ml-auto">
            <ThemeToggle className="relative top-0 right-0" />
        </div>
      </header>
      <main className="flex-1 p-4">
        <WheelCanvas />
      </main>
    </div>
  );
}