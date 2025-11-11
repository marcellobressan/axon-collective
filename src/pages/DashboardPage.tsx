import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, MoreVertical, Trash2, Copy, Eye, Lock, Globe, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Wheel } from '@shared/types';
import { Header } from '@/components/Header';
const getUserId = (): string => {
  let userId = localStorage.getItem('futures-wheel-hub-user-id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('futures-wheel-hub-user-id', userId);
  }
  return userId;
};
const FIRST_VISIT_KEY = 'futures-wheel-hub-has-visited';
export function DashboardPage() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWheelTitle, setNewWheelTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const userId = getUserId();
  useEffect(() => {
    const fetchWheels = async () => {
      try {
        setIsLoading(true);
        const userWheels = await api<Wheel[]>(`/api/wheels?userId=${userId}`);
        setWheels(userWheels.sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0)));
      } catch (error) {
        console.error('Failed to fetch wheels:', error);
        toast.error('Failed to load your wheels.');
      } finally {
        setIsLoading(false);
      }
    };
    const handleFirstVisit = async () => {
      const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
      if (!hasVisited) {
        localStorage.setItem(FIRST_VISIT_KEY, 'true');
        try {
          const demoWheel = await api<Wheel>('/api/wheels/create-demo', {
            method: 'POST',
            body: JSON.stringify({ userId }),
          });
          toast.success('Welcome! We added a demo wheel for you to explore.');
          setWheels(prev => [demoWheel, ...prev].sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0)));
        } catch (error) {
          console.error('Failed to create demo wheel:', error);
          toast.error('Could not create a demo wheel for you.');
        }
      }
    };
    fetchWheels().then(() => {
      handleFirstVisit();
    });
  }, [userId]);
  const handleCreateWheel = async () => {
    if (!newWheelTitle.trim()) {
      toast.error('Please enter a title for your new wheel.');
      return;
    }
    try {
      const newWheel = await api<Wheel>('/api/wheels', {
        method: 'POST',
        body: JSON.stringify({ title: newWheelTitle, ownerId: userId }),
      });
      navigate(`/wheel/${newWheel.id}`);
    } catch (error) {
      console.error('Failed to create wheel:', error);
      toast.error('Failed to create a new wheel.');
    }
  };
  const handleDeleteWheel = async (wheelId: string) => {
    const promise = api(`/api/wheels/${wheelId}?userId=${userId}`, { method: 'DELETE' });
    toast.promise(promise, {
      loading: 'Deleting wheel...',
      success: () => {
        setWheels(wheels.filter((w) => w.id !== wheelId));
        return 'Wheel deleted successfully.';
      },
      error: 'Failed to delete wheel.',
    });
  };
  const handleCopyLink = (wheelId: string) => {
    const url = `${window.location.origin}/wheel/${wheelId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard!');
    });
  };
  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Wheels</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Wheel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Futures Wheel</DialogTitle>
                <DialogDescription>
                  What is the central idea, trend, or event you want to explore?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="wheel-title">Title</Label>
                <Input
                  id="wheel-title"
                  value={newWheelTitle}
                  onChange={(e) => setNewWheelTitle(e.target.value)}
                  placeholder="e.g., 'The Rise of AI in Education'"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWheel()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateWheel}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : wheels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wheels.map((wheel) => (
              <Card key={wheel.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold pr-2">{wheel.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleCopyLink(wheel.id)}>
                          <Copy className="w-4 h-4 mr-2" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDeleteWheel(wheel.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    {wheel.lastModified ? `Updated ${formatDistanceToNow(new Date(wheel.lastModified), { addSuffix: true })}` : 'Not updated yet'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {wheel.visibility === 'public' ? (
                    <Badge variant="outline" className="text-blue-600 border-blue-600"><Globe className="w-3 h-3 mr-1" />Public</Badge>
                  ) : (
                    <Badge variant="secondary"><Lock className="w-3 h-3 mr-1" />Private</Badge>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/wheel/${wheel.id}`}>
                      <Eye className="w-4 h-4 mr-2" /> Open Wheel
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background rounded-lg shadow-sm border border-dashed">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold">Start Your First Exploration</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Futures wheels help you map the consequences of an idea. Click the button below to create one.
            </p>
            <div className="mt-6">
              <Button size="lg" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Wheel
              </Button>
            </div>
          </div>
        )}
      </main>
      <Toaster richColors />
    </div>
  );
}