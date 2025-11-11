import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BrainCircuit, Trash2, MoreVertical, Globe, Lock, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Wheel } from '@shared/types';
const getUserId = (): string => {
  let userId = localStorage.getItem('futures-wheel-hub-user-id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('futures-wheel-hub-user-id', userId);
  }
  return userId;
};
export function HomePage() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWheelTitle, setNewWheelTitle] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [wheelToDelete, setWheelToDelete] = useState<Wheel | null>(null);
  const navigate = useNavigate();
  const userId = useMemo(() => getUserId(), []);
  useEffect(() => {
    const fetchWheels = async () => {
      try {
        setIsLoading(true);
        const data = await api<Wheel[]>(`/api/wheels?userId=${userId}`);
        setWheels(data.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0)));
      } catch (error) {
        console.error('Failed to fetch wheels:', error);
        toast.error('Could not load your wheels. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWheels();
  }, [userId]);
  const handleCreateWheel = async () => {
    if (!newWheelTitle.trim()) {
      toast.warning('Please enter a title for your new wheel.');
      return;
    }
    try {
      const newWheel = await api<Wheel>('/api/wheels', {
        method: 'POST',
        body: JSON.stringify({ title: newWheelTitle.trim(), ownerId: userId }),
      });
      toast.success(`Wheel "${newWheel.title}" created!`);
      setWheels((prev) => [newWheel, ...prev]);
      setNewWheelTitle('');
      setIsCreateDialogOpen(false);
      navigate(`/wheel/${newWheel.id}`);
    } catch (error) {
      console.error('Failed to create wheel:', error);
      toast.error('Failed to create wheel. Please try again.');
    }
  };
  const confirmDelete = (wheel: Wheel) => {
    setWheelToDelete(wheel);
    setIsDeleteDialogOpen(true);
  };
  const handleDeleteWheel = async () => {
    if (!wheelToDelete) return;
    try {
      await api(`/api/wheels/${wheelToDelete.id}?userId=${userId}`, { method: 'DELETE' });
      toast.success(`Wheel "${wheelToDelete.title}" has been deleted.`);
      setWheels(wheels.filter(w => w.id !== wheelToDelete.id));
    } catch (error) {
      console.error('Failed to delete wheel:', error);
      toast.error('Failed to delete wheel. Please try again.');
    } finally {
      setIsDeleteDialogOpen(false);
      setWheelToDelete(null);
    }
  };
  const handleVisibilityChange = async (wheel: Wheel, visibility: 'public' | 'private') => {
    try {
      const updatedWheel = await api<Wheel>(`/api/wheels/${wheel.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ userId, visibility }),
      });
      setWheels(wheels.map(w => w.id === wheel.id ? updatedWheel : w));
      toast.success(`Wheel is now ${visibility}.`);
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error('Failed to update visibility.');
    }
  };
  const handleCopyLink = (wheel: Wheel) => {
    if (wheel.visibility === 'private') {
      toast.error('Cannot share a private wheel. Make it public first.');
      return;
    }
    const url = `${window.location.origin}/wheel/${wheel.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Public link copied to clipboard!');
    });
  };
  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <BrainCircuit className="w-10 h-10 text-indigo-500" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Futures Wheel Hub
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A visually stunning, real-time collaborative tool for futures wheel brainstorming and strategic foresight.
            </p>
          </header>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Your Wheels</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create New Wheel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Futures Wheel</DialogTitle>
                  <DialogDescription>
                    What is the central idea, event, or trend you want to explore?
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="name"
                      value={newWheelTitle}
                      onChange={(e) => setNewWheelTitle(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., 'AI in Education'"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateWheel}>
                    Create Wheel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : wheels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wheels.map((wheel) => (
                <Card key={wheel.id} className="flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <Link to={`/wheel/${wheel.id}`} className="flex-grow flex flex-col">
                    <CardHeader className="flex-grow">
                      <div className="flex justify-between items-start">
                        <CardTitle className="truncate pr-2">{wheel.title}</CardTitle>
                        <Badge variant={wheel.visibility === 'public' ? 'outline' : 'secondary'}>
                          {wheel.visibility === 'public' ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                          {wheel.visibility.charAt(0).toUpperCase() + wheel.visibility.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>
                        {wheel.nodes.length} nodes, {wheel.edges.length} connections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {wheel.lastModified ? `Updated ${formatDistanceToNow(new Date(wheel.lastModified), { addSuffix: true })}` : 'Not yet modified'}
                      </p>
                    </CardContent>
                  </Link>
                  <CardFooter className="p-4 border-t mt-auto flex justify-between items-center">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); confirmDelete(wheel); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleCopyLink(wheel)} disabled={wheel.visibility === 'private'}>
                          <Copy className="w-4 h-4 mr-2" /> Copy Public Link
                        </DropdownMenuItem>
                        {wheel.visibility === 'private' ? (
                          <DropdownMenuItem onSelect={() => handleVisibilityChange(wheel, 'public')}>
                            <Globe className="w-4 h-4 mr-2" /> Make Public
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => handleVisibilityChange(wheel, 'private')}>
                            <Lock className="w-4 h-4 mr-2" /> Make Private
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-medium text-foreground">No wheels yet</h3>
              <p className="text-muted-foreground mt-2">
                Get started by creating your first futures wheel.
              </p>
            </div>
          )}
        </div>
      </div>
      <footer className="text-center py-8 text-muted-foreground text-sm">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the wheel "{wheelToDelete?.title}" and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWheel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster richColors />
    </div>
  );
}