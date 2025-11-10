import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Wheel } from '@shared/types';
export function HomePage() {
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWheelTitle, setNewWheelTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchWheels = async () => {
      try {
        setIsLoading(true);
        const data = await api<Wheel[]>('/api/wheels');
        setWheels(data);
      } catch (error) {
        console.error('Failed to fetch wheels:', error);
        toast.error('Could not load your wheels. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWheels();
  }, []);
  const handleCreateWheel = async () => {
    if (!newWheelTitle.trim()) {
      toast.warning('Please enter a title for your new wheel.');
      return;
    }
    try {
      const newWheel = await api<Wheel>('/api/wheels', {
        method: 'POST',
        body: JSON.stringify({ title: newWheelTitle.trim() }),
      });
      toast.success(`Wheel "${newWheel.title}" created!`);
      setWheels((prev) => [...prev, newWheel]);
      setNewWheelTitle('');
      setIsDialogOpen(false);
      navigate(`/wheel/${newWheel.id}`);
    } catch (error) {
      console.error('Failed to create wheel:', error);
      toast.error('Failed to create wheel. Please try again.');
    }
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
                Axon Collective
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A visually stunning, real-time collaborative tool for futures wheel brainstorming and strategic foresight.
            </p>
          </header>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">Your Wheels</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <Link to={`/wheel/${wheel.id}`} key={wheel.id}>
                  <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="truncate">{wheel.title}</CardTitle>
                      <CardDescription>
                        {wheel.nodes.length} nodes, {wheel.edges.length} connections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Click to open and edit this wheel.</p>
                    </CardContent>
                  </Card>
                </Link>
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
        <p>Built with ��️ at Cloudflare</p>
      </footer>
      <Toaster richColors />
    </div>
  );
}