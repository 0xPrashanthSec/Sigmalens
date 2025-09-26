import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { SigmaConverter } from '@/components/SigmaConverter';
import { SigmaRuleBrowser } from '@/components/SigmaRuleBrowser';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Github, BookOpen } from 'lucide-react';
import { api } from '@/lib/api-client';
export function HomePage() {
  const [sigmaInput, setSigmaInput] = useState('');
  const [selectedRulePath, setSelectedRulePath] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const handleRuleSelect = useCallback(async (path: string) => {
    if (path === selectedRulePath) return;
    setIsFetching(true);
    setSelectedRulePath(path);
    const toastId = toast.loading(`Loading rule: ${path.split('/').pop()}`);
    try {
      const result = await api<{ content: string }>('/api/sigma-rule-content', {
        method: 'POST',
        body: JSON.stringify({ path }),
      });
      setSigmaInput(result.content);
      toast.success('Rule loaded successfully!', { id: toastId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error('Failed to load rule content.', { id: toastId, description: errorMessage });
      setSigmaInput(''); // Clear input on failure
    } finally {
      setIsFetching(false);
    }
  }, [selectedRulePath]);
  return (
    <>
      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col">
        <ThemeToggle className="fixed top-4 right-4 z-50" />
        <header className="py-4 px-4 sm:px-6 lg:px-8 border-b flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="max-w-full mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50">
              Sigma<span className="text-blue-500">Lens</span>
            </h1>
            <a
              href="https://github.com/SigmaHQ/sigma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              aria-label="SigmaHQ GitHub Repository"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
        </header>
        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-white dark:bg-black/20">
            <div className="flex flex-col h-full">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Rule Browser
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Browse rules from SigmaHQ</p>
              </div>
              <div className="flex-grow">
                <SigmaRuleBrowser onRuleSelect={handleRuleSelect} selectedRulePath={selectedRulePath} />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
            <main className="py-8 md:py-12 h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-black">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 animate-fade-in">
                  <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    Instant Sigma to Kibana Conversion
                  </h2>
                  <p className="mt-3 max-w-2xl mx-auto text-base text-slate-600 dark:text-slate-400">
                    Select a rule from the browser or paste your own to instantly generate a Kibana query in ECS format.
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <SigmaConverter sigmaInput={isFetching ? 'Loading rule...' : sigmaInput} onSigmaInputChange={setSigmaInput} />
                </motion.div>
              </div>
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
        <footer className="py-4 text-center border-t flex-shrink-0 bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Built with ❤️ at Cloudflare
          </p>
        </footer>
      </div>
      <Toaster richColors position="bottom-right" />
    </>
  );
}