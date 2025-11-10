import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { WheelCanvas } from '@/components/WheelCanvas';
import useWheelStore from '@/store/wheelStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'react-use';
export function WheelPage() {
  const { wheelId } = useParams<{ wheelId: string }>();
  const fetchWheel = useWheelStore((s) => s.fetchWheel);
  const title = useWheelStore((s) => s.title);
  const isLoading = useWheelStore((s) => s.isLoading);
  const updateTitle = useWheelStore((s) => s.updateTitle);
  const saveWheel = useWheelStore((s) => s.saveWheel);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (wheelId) {
      fetchWheel(wheelId);
    }
  }, [wheelId, fetchWheel]);
  useEffect(() => {
    if (!isLoading) {
      setLocalTitle(title);
    }
  }, [title, isLoading]);
  useDebounce(() => {
    if (isEditingTitle && localTitle !== title) {
      updateTitle(localTitle);
      saveWheel();
    }
  }, 500, [localTitle, isEditingTitle]);
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== title) {
      updateTitle(localTitle);
      saveWheel();
    }
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalTitle(title);
      setIsEditingTitle(false);
    }
  };
  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);
  return (
    <div className="h-screen w-screen flex flex-col bg-muted/30">
      <header className="flex items-center p-4 border-b bg-background shadow-sm z-10">
        <Button asChild variant="ghost" size="icon">
            <Link to="/">
                <ArrowLeft className="w-5 h-5" />
            </Link>
        </Button>
        <div className="w-px h-6 bg-border mx-4" />
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-xl font-semibold h-9"
            />
            <Button size="icon" variant="ghost" onClick={handleTitleBlur}><Check className="w-5 h-5" /></Button>
          </div>
        ) : (
          <h1
            className="text-xl font-semibold text-foreground cursor-pointer hover:bg-muted p-1 rounded-md"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit title"
          >
            {isLoading ? 'Loading...' : title}
          </h1>
        )}
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