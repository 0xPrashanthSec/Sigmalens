import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Clipboard, ServerCrash } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
interface CodeBlockProps {
  language: 'yaml' | 'json' | 'kql';
  code: string;
  isLoading: boolean;
  title: string;
  placeholder: string;
}
export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, isLoading, title, placeholder }) => {
  const { isDark } = useTheme();
  const [hasCopied, setHasCopied] = React.useState(false);
  const onCopy = () => {
    if (hasCopied || !code) return;
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    toast.success('Query copied to clipboard!');
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };
  // Use 'sql' for highlighting KQL as it has similar keywords and structure
  const highlighterLanguage = language === 'kql' ? 'sql' : language;
  return (
    <Card className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50 shadow-inner">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <CardTitle className="text-base font-medium text-slate-600 dark:text-slate-300">{title}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopy}
          disabled={!code || isLoading}
          className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow relative">
        <div className="absolute inset-0 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-4 w-[85%]" />
            </div>
          ) : code ? (
            <SyntaxHighlighter
              language={highlighterLanguage}
              style={isDark ? vscDarkPlus : vs}
              customStyle={{
                margin: 0,
                padding: '16px',
                background: 'transparent',
                fontSize: '14px',
                height: '100%',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'var(--font-mono), monospace',
                },
              }}
            >
              {code}
            </SyntaxHighlighter>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <ServerCrash className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {placeholder}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Your generated query will appear here.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};