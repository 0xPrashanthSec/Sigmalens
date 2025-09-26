/**
 * Generic ApiResponse structure for consistent API responses.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
/**
 * Represents the structure of a parsed Sigma rule from YAML.
 * This is a simplified version for the initial implementation.
 */
export interface SigmaRule {
  title: string;
  logsource: {
    category?: string;
    product?: string;
    service?: string;
  };
  detection: {
    [key:string]: any; // Allow any other properties on detection
    condition: string;
  };
  [key: string]: any; // Allow other properties on the root
}
/**
 * Represents a KQL query, which is a string.
 */
export type KibanaQuery = string;
/**
 * Represents a file or directory from the GitHub API tree.
 */
export interface SigmaRuleFile {
  path: string;
  type: 'blob' | 'tree';
}
/**
 * Represents the nested structure for displaying the rule tree in the UI.
 * Directories are keys, and a special `_files` key holds the list of files.
 */
export interface SigmaRuleTree {
  _files?: SigmaRuleFile[];
  [key: string]: SigmaRuleTree | SigmaRuleFile[] | undefined;
}