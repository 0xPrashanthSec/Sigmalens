import { Hono } from "hono";
import type { Env } from './core-utils';
import { ok, bad } from './core-utils';
import { convertSigmaToKql } from './sigma-converter';
import type { SigmaRuleFile } from '@shared/types';
const GITHUB_API_URL = 'https://api.github.com/repos/SigmaHQ/sigma/git/trees/master?recursive=1';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/SigmaHQ/sigma/master';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  /**
   * Main API endpoint for converting a Sigma rule to a Kibana Query Language (KQL) string.
   * Expects a POST request with a JSON body containing a 'rule' property with the YAML string.
   */
  app.post('/api/convert', async (c) => {
    try {
      const body = await c.req.json<{ rule?: string }>();
      if (!body.rule || typeof body.rule !== 'string' || body.rule.trim() === '') {
        return bad(c, 'Sigma rule (string) is required in the request body.');
      }
      const kqlQuery = convertSigmaToKql(body.rule);
      return ok(c, { query: kqlQuery });
    } catch (error) {
      console.error('Conversion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during conversion.';
      return bad(c, `Conversion Failed: ${errorMessage}`);
    }
  });
  /**
   * Fetches the file tree for the SigmaHQ/sigma repository.
   * Caches the response for 1 hour to avoid hitting GitHub rate limits.
   */
  app.get('/api/sigma-rules', async (c) => {
    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: { 'User-Agent': 'SigmaLens-Cloudflare-Worker' },
        cf: {
          cacheTtl: 3600, // Cache for 1 hour
          cacheEverything: true,
        },
      });
      if (!response.ok) {
        throw new Error(`GitHub API responded with status: ${response.status}`);
      }
      const data: { tree: SigmaRuleFile[] } = await response.json();
      const ymlFiles = data.tree.filter(file => file.path.endsWith('.yml') && file.type === 'blob');
      return ok(c, ymlFiles);
    } catch (error) {
      console.error('Failed to fetch sigma rules:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
      return bad(c, `Could not fetch rules from GitHub: ${errorMessage}`);
    }
  });
  /**
   * Fetches the raw content of a specific Sigma rule file from GitHub.
   */
  app.post('/api/sigma-rule-content', async (c) => {
    try {
      const { path } = await c.req.json<{ path?: string }>();
      if (!path || typeof path !== 'string') {
        return bad(c, 'File path is required.');
      }
      const response = await fetch(`${GITHUB_RAW_URL}/${path}`, {
        headers: { 'User-Agent': 'SigmaLens-Cloudflare-Worker' },
      });
      if (!response.ok) {
        throw new Error(`File not found or GitHub API error (Status: ${response.status})`);
      }
      const content = await response.text();
      return ok(c, { content });
    } catch (error) {
      console.error('Failed to fetch rule content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
      return bad(c, `Could not fetch rule content: ${errorMessage}`);
    }
  });
}