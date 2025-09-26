import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
import type { SigmaRuleFile, SigmaRuleTree } from '@shared/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileCode, Folder } from 'lucide-react';
import { Input } from '@/components/ui/input';
interface SigmaRuleBrowserProps {
  onRuleSelect: (path: string) => void;
  selectedRulePath: string | null;
}
const buildTree = (files: SigmaRuleFile[]): SigmaRuleTree => {
  const tree: SigmaRuleTree = {};
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = tree;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        if (!currentLevel._files) {
          currentLevel._files = [];
        }
        currentLevel._files.push(file);
      } else {
        // It's a directory
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part] as SigmaRuleTree;
      }
    });
  });
  return tree;
};
const TreeView: React.FC<{
  tree: SigmaRuleTree;
  onRuleSelect: (path: string) => void;
  selectedRulePath: string | null;
}> = ({ tree, onRuleSelect, selectedRulePath }) => {
  const sortedEntries = Object.entries(tree).sort(([a], [b]) => {
    if (a === '_files') return 1;
    if (b === '_files') return -1;
    return a.localeCompare(b);
  });
  return (
    <Accordion type="multiple" className="w-full">
      {sortedEntries.map(([name, children]) => {
        if (name === '_files' && Array.isArray(children)) {
          return (
            <ul key="_files" className="pt-1">
              {children.map(file => (
                <li key={file.path}>
                  <button
                    onClick={() => onRuleSelect(file.path)}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors ${
                      selectedRulePath === file.path
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileCode className="w-4 h-4 flex-shrink-0 text-slate-500" />
                    <span className="truncate">{file.path.split('/').pop()}</span>
                  </button>
                </li>
              ))}
            </ul>
          );
        }
        if (typeof children === 'object' && children !== null && !Array.isArray(children)) {
          return (
            <AccordionItem value={name} key={name}>
              <AccordionTrigger className="px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold capitalize">{name.replace(/_/g, ' ')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 border-l ml-2">
                <TreeView tree={children as SigmaRuleTree} onRuleSelect={onRuleSelect} selectedRulePath={selectedRulePath} />
              </AccordionContent>
            </AccordionItem>
          );
        }
        return null;
      })}
    </Accordion>
  );
};
export function SigmaRuleBrowser({ onRuleSelect, selectedRulePath }: SigmaRuleBrowserProps) {
  const [rules, setRules] = useState<SigmaRuleFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setIsLoading(true);
        const data = await api<SigmaRuleFile[]>('/api/sigma-rules');
        setRules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rules.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRules();
  }, []);
  const filteredRules = useMemo(() => {
    if (!searchTerm) return rules;
    return rules.filter(rule => rule.path.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [rules, searchTerm]);
  const ruleTree = useMemo(() => buildTree(filteredRules), [filteredRules]);
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400">
        <AlertCircle className="mx-auto h-8 w-8 mb-2" />
        <p className="font-semibold">Error loading rules</p>
        <p className="text-xs">{error}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Input
          placeholder="Search rules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-2">
          <TreeView tree={ruleTree} onRuleSelect={onRuleSelect} selectedRulePath={selectedRulePath} />
        </div>
      </ScrollArea>
    </div>
  );
}