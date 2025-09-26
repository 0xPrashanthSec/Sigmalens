import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Wand2, UploadCloud, FileText, Loader2, X } from 'lucide-react';
import * as yaml from 'js-yaml';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/CodeBlock';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
interface SigmaConverterProps {
  sigmaInput: string;
  onSigmaInputChange: (value: string) => void;
}
export function SigmaConverter({ sigmaInput, onSigmaInputChange }: SigmaConverterProps) {
  const [kibanaOutput, setKibanaOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onabort = () => toast.error('File reading was aborted.');
      reader.onerror = () => toast.error('File reading has failed.');
      reader.onload = () => {
        const fileContent = reader.result as string;
        onSigmaInputChange(fileContent);
        toast.success(`${file.name} loaded successfully!`);
      };
      reader.readAsText(file);
    }
  }, [onSigmaInputChange]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/yaml': ['.yml', '.yaml'] },
    maxFiles: 1,
  });
  const handleConvert = async () => {
    if (!sigmaInput.trim()) {
      toast.error('Sigma rule input cannot be empty.');
      return;
    }
    try {
      yaml.load(sigmaInput);
    } catch (e) {
      toast.error('Invalid YAML format.', {
        description: (e as Error).message,
      });
      return;
    }
    setIsLoading(true);
    setKibanaOutput('');
    setError(null);
    try {
      const result = await api<{ query: string }>('/api/convert', {
        method: 'POST',
        body: JSON.stringify({ rule: sigmaInput }),
      });
      setKibanaOutput(result.query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error('Conversion Failed', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className="overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl h-[522px] flex flex-col">
            <Tabs defaultValue="paste" className="w-full flex flex-col flex-grow">
              <TabsList className="grid w-full grid-cols-2 rounded-none flex-shrink-0">
                <TabsTrigger value="paste" className="py-3 rounded-none"><FileText className="w-4 h-4 mr-2"/>Paste Rule</TabsTrigger>
                <TabsTrigger value="upload" className="py-3 rounded-none"><UploadCloud className="w-4 h-4 mr-2"/>Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="p-1 flex-grow relative">
                {sigmaInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 z-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => onSigmaInputChange('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Textarea
                  placeholder="title: Suspicious PowerShell Activity..."
                  className="h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={sigmaInput}
                  onChange={(e) => onSigmaInputChange(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="upload" className="p-4 flex-grow">
                <div
                  {...getRootProps()}
                  className={cn(
                    'flex flex-col items-center justify-center h-full border-2 border-dashed rounded-md cursor-pointer transition-colors',
                    isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="text-center text-slate-500 dark:text-slate-400">
                    <UploadCloud className="mx-auto h-12 w-12 mb-4" />
                    {isDragActive ? (
                      <p className="font-semibold">Drop the file here ...</p>
                    ) : (
                      <>
                        <p className="font-semibold">Drag & drop a .yml file here</p>
                        <p className="text-xs mt-1">or click to select a file</p>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        <div className="h-[522px]">
          <CodeBlock
            language="kql"
            code={kibanaOutput}
            isLoading={isLoading}
            title="Kibana Query (ECS)"
            placeholder={error ? 'Conversion Failed' : 'Output Panel'}
          />
        </div>
      </div>
      <div className="lg:col-span-2 flex justify-center">
        <Button
          onClick={handleConvert}
          disabled={isLoading || !sigmaInput}
          size="lg"
          className="w-full max-w-md text-lg py-6 font-semibold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-in-out bg-blue-600 hover:bg-blue-700 text-white"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center"
              >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Converting...
              </motion.div>
            ) : (
              <motion.div
                key="convert"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center"
              >
                <Wand2 className="mr-2 h-5 w-5" />
                Convert Rule
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}