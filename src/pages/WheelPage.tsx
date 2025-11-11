import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Share2, Copy, Globe, Lock } from 'lucide-react';
import { WheelCanvas } from '@/components/WheelCanvas';
import useWheelStore from '@/store/wheelStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from 'react-use';
import { toast } from 'sonner';
export function WheelPage() {
  const { wheelId } = useParams<{ wheelId: string }>();
  const fetchWheel = useWheelStore((s) => s.fetchWheel);
  const title = useWheelStore((s) => s.title);
  const isLoading = useWheelStore((s) => s.isLoading);
  const error = useWheelStore((s) => s.error);
  const updateTitle = useWheelStore((s) => s.updateTitle);
  const saveWheel = useWheelStore((s) => s.saveWheel);
  const visibility = useWheelStore((s) => s.visibility);
  const ownerId = useWheelStore((s) => s.ownerId);
  const userId = useWheelStore((s) => s.userId);
  const updateWheelVisibility = useWheelStore((s) => s.updateWheelVisibility);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOwner = ownerId === userId;
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
    if (isEditingTitle && localTitle !== title && isOwner) {
      updateTitle(localTitle);
      saveWheel();
    }
  }, 500, [localTitle, isEditingTitle, isOwner]);
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== title && isOwner) {
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
  const handleVisibilityToggle = async (isPublic: boolean) => {
    const newVisibility = isPublic ? 'public' : 'private';
    const promise = updateWheelVisibility(newVisibility);
    toast.promise(promise, {
      loading: 'Updating visibility...',
      success: `Wheel is now ${newVisibility}.`,
      error: 'Failed to update visibility.',
    });
  };
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    });
  };
  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);
  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-muted/30 text-center p-4">
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You do not have permission to view this wheel, or it does not exist.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="h-screen w-screen flex flex-col bg-muted/30">
      <header className="flex items-center p-4 border-b bg-background shadow-sm z-10">
        <Button asChild variant="ghost" size="icon">
            <Link to="/">
                <ArrowLeft className="w-5 h-5" />
            </Link>
        </Button>
        <div className="w-px h-6 bg-border mx-4" />
        {isEditingTitle && isOwner ? (
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
            className={`text-xl font-semibold text-foreground ${isOwner ? 'cursor-pointer hover:bg-muted p-1 rounded-md' : ''}`}
            onClick={() => isOwner && setIsEditingTitle(true)}
            title={isOwner ? "Click to edit title" : ""}
          >
            {isLoading ? 'Loading...' : title}
          </h1>
        )}
        <div className="ml-auto flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Share "{title}"</SheetTitle>
                  <SheetDescription>
                    Manage access and share your futures wheel with others.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-6">
                  {isOwner ? (
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <Switch
                        id="visibility-switch"
                        checked={visibility === 'public'}
                        onCheckedChange={handleVisibilityToggle}
                      />
                      <Label htmlFor="visibility-switch" className="flex-grow">
                        <div className="font-medium">Public Access</div>
                        <div className="text-sm text-muted-foreground">Anyone with the link can view.</div>
                      </Label>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg flex items-center gap-3">
                      {visibility === 'public' ? <Globe className="w-5 h-5 text-blue-500" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <div className="font-medium">{visibility === 'public' ? 'Public' : 'Private'}</div>
                        <div className="text-sm text-muted-foreground">
                          {visibility === 'public' ? 'This wheel is viewable by anyone.' : 'Only the owner can view this wheel.'}
                        </div>
                      </div>
                    </div>
                  )}
                  {visibility === 'public' && (
                    <div className="space-y-2">
                      <Label htmlFor="share-link">Shareable Link</Label>
                      <div className="flex gap-2">
                        <Input id="share-link" value={window.location.href} readOnly />
                        <Button onClick={handleCopyLink} size="icon" variant="outline">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <ThemeToggle className="relative top-0 right-0" />
        </div>
      </header>
      <main className="flex-1 p-4">
        <WheelCanvas />
      </main>
    </div>
  );
}