import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { BrainCircuit, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
const getUserId = (): string => {
  let userId = localStorage.getItem('futures-wheel-hub-user-id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('futures-wheel-hub-user-id', userId);
  }
  return userId;
};
export function LandingPage() {
  const navigate = useNavigate();
  const handleSignIn = () => {
    getUserId(); // Ensures user ID is set
    navigate('/dashboard');
  };
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-500" />
            <span className="text-2xl font-bold font-display">Futures Wheel Hub</span>
          </div>
          <Button onClick={handleSignIn}>Sign In</Button>
        </header>
        {/* Hero Section */}
        <main className="py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold font-display text-balance leading-tight">
              Map the Future, Together.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-pretty">
              A visually stunning, real-time collaborative tool for futures wheel brainstorming and strategic foresight. Uncover the ripple effects of any idea.
            </p>
            <div className="mt-10">
              <Button size="lg" onClick={handleSignIn} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:-translate-y-1 transition-transform duration-200">
                Get Started for Free
              </Button>
            </div>
          </motion.div>
        </main>
        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={featureVariants} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Real-Time Collaboration</h3>
              <p className="mt-2 text-muted-foreground">
                Brainstorm with your team simultaneously on an infinite canvas. See changes as they happen.
              </p>
            </motion.div>
            <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={featureVariants} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <BrainCircuit className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Intuitive Mind Mapping</h3>
              <p className="mt-2 text-muted-foreground">
                Easily build out first, second, and third-order consequences with our beautiful radial layout.
              </p>
            </motion.div>
            <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={featureVariants} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Users className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Strategic Foresight</h3>
              <p className="mt-2 text-muted-foreground">
                Vote on probabilities, identify key outcomes, and generate AI-powered reports to guide your strategy.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
      <footer className="text-center text-sm text-muted-foreground py-8 border-t">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
    </div>
  );
}