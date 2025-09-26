import * as yaml from 'js-yaml';
import type { SigmaRule, KibanaQuery } from '@shared/types';
type DetectionValue = string | string[] | { [key: string]: string | string[] };
// Massively expanded "Universal" Elastic Common Schema (ECS) mapping.
// Keys are lowercase for case-insensitive matching.
const ecsMapping: { [key: string]: string } = {
  // Process
  'processid': 'process.pid',
  'process.pid': 'process.pid',
  'image': 'process.executable',
  'process.executable': 'process.executable',
  'description': 'process.title',
  'commandline': 'process.command_line',
  'process.command_line': 'process.command_line',
  'currentdirectory': 'process.working_directory',
  'user': 'user.name',
  'username': 'user.name',
  'integritylevel': 'process.integrity_level',
  'logonid': 'process.logon_id',
  'parentprocessid': 'process.parent.pid',
  'parentimage': 'process.parent.executable',
  'parentcommandline': 'process.parent.command_line',
  'originalfilename': 'process.pe.original_file_name',
  // File
  'filename': 'file.name',
  'file.name': 'file.name',
  'targetfilename': 'file.path',
  'file.path': 'file.path',
  'directory': 'file.directory',
  'file.directory': 'file.directory',
  'sourcefilename': 'source.file.path',
  'hashes': 'file.hash.*',
  'imphash': 'file.pe.imphash',
  'md5': 'file.hash.md5',
  'sha1': 'file.hash.sha1',
  'sha256': 'file.hash.sha256',
  // Network
  'sourceip': 'source.ip',
  'src_ip': 'source.ip',
  'source.ip': 'source.ip',
  'destinationip': 'destination.ip',
  'dst_ip': 'destination.ip',
  'destination.ip': 'destination.ip',
  'sourceport': 'source.port',
  'src_port': 'source.port',
  'source.port': 'source.port',
  'destinationport': 'destination.port',
  'dst_port': 'destination.port',
  'destination.port': 'destination.port',
  'protocol': 'network.protocol',
  'network.protocol': 'network.protocol',
  'url': 'url.full',
  'url.full': 'url.full',
  'http_method': 'http.request.method',
  'http.request.method': 'http.request.method',
  'user_agent': 'user_agent.original',
  'useragent': 'user_agent.original',
  'user_agent.original': 'user_agent.original',
  // Registry
  'targetobject': 'registry.path',
  'registry.path': 'registry.path',
  'details': 'registry.data.strings',
  'newname': 'registry.value',
  // Windows Events
  'eventid': 'winlog.event_id',
  'winlog.event_id': 'winlog.event_id',
  'provider_name': 'winlog.provider_name',
  'channel': 'winlog.channel',
  'computer': 'host.name',
  'host.name': 'host.name',
  'hostname': 'host.name',
  'task': 'winlog.task',
  'opcode': 'winlog.opcode',
  'service': 'service.name',
  'servicename': 'service.name',
  'servicefilename': 'service.executable',
  'failurecode': 'winlog.event_data.FailureCode',
  'samaccountname': 'user.name',
  'ipaddress': 'source.ip',
  'workstationname': 'source.domain',
  'sharename': 'network.share.name',
  'objectname': 'file.path',
  'accessmask': 'winlog.event_data.AccessMask',
  'subjectlogonid': 'winlog.event_data.SubjectLogonId',
  'subjectusername': 'user.name',
  'subjectdomainname': 'user.domain',
  // Cloud
  'aws.region': 'cloud.region',
  'useridentity.arn': 'cloud.account.id',
  'sourceipaddress': 'source.ip',
  'useridentity.username': 'user.name',
  'eventname': 'event.action',
  'eventsource': 'event.provider',
  // Generic / Other
  'rulename': 'rule.name',
  'rule.name': 'rule.name',
  'pipe': 'file.path',
  'pipename': 'file.path',
  'queryname': 'dns.question.name',
  'queryresults': 'dns.answers.data',
};
/**
 * Converts a key-value pair from a Sigma rule into a KQL clause.
 * Handles simple key:value, key:[val1, val2], and modifiers like '|contains'.
 * Applies ECS mapping case-insensitively.
 */
function createKqlClause(field: string, value: string | string[]): string {
  const fieldLower = field.toLowerCase();
  const modifiers = fieldLower.split('|').slice(1);
  const cleanField = field.split('|')[0].trim();
  const ecsField = ecsMapping[cleanField.toLowerCase()] || cleanField;
  const processSingleValue = (val: string): string => {
    let formattedValue = String(val).includes(' ') ? `"${val}"` : val;
    if (modifiers.includes('startswith')) {
      formattedValue = `"${val}*"`;
    } else if (modifiers.includes('endswith')) {
      formattedValue = `"*${val}"`;
    } else if (modifiers.includes('contains')) {
      formattedValue = `"*${val}*"`;
    }
    return `${ecsField}:${formattedValue}`;
  };
  if (Array.isArray(value)) {
    const clauses = value.map(v => processSingleValue(v));
    if (modifiers.includes('all')) {
      return `(${clauses.join(' and ')})`;
    }
    return `(${clauses.join(' or ')})`;
  }
  return processSingleValue(String(value));
}
/**
 * Parses a detection map (e.g., 'selection', 'filter') into a KQL string.
 */
function parseDetectionMap(detection: DetectionValue): string {
  if (typeof detection !== 'object' || detection === null || Array.isArray(detection)) {
    return '';
  }
  const clauses = Object.entries(detection).map(([field, value]) => createKqlClause(field, value));
  return clauses.join(' and ');
}
/**
 * Processes a single selection from the detection block.
 */
function processSelection(detectionBody: DetectionValue | DetectionValue[]): string {
  if (Array.isArray(detectionBody)) {
    // Handle lists of maps (OR'd together)
    const clauses = detectionBody.map(item => `(${parseDetectionMap(item)})`);
    return `(${clauses.join(' or ')})`;
  }
  // Handle a single map
  return `(${parseDetectionMap(detectionBody)})`;
}
/**
 * Main function to convert a raw YAML string of a Sigma rule to a KQL query.
 */
export function convertSigmaToKql(ruleYaml: string): KibanaQuery {
  const parsedRule = yaml.load(ruleYaml);
  if (typeof parsedRule !== 'object' || parsedRule === null) {
    throw new Error('Invalid YAML: The rule must be a YAML object.');
  }
  const rule = parsedRule as SigmaRule;
  const { detection } = rule;
  if (!detection || !detection.condition) {
    throw new Error("Invalid Sigma rule: 'detection' and 'condition' fields are required.");
  }
  const condition = detection.condition.trim();
  const selections = Object.keys(detection).filter(k => k !== 'condition');
  const selectionClauses: { [key: string]: string } = {};
  for (const selection of selections) {
    selectionClauses[selection] = processSelection(detection[selection]);
  }
  const getClausesForIdentifier = (identifier: string): string[] => {
    if (identifier.endsWith('*')) {
      const prefix = identifier.slice(0, -1);
      return selections
        .filter(s => s.startsWith(prefix))
        .map(sel => selectionClauses[sel])
        .filter(Boolean);
    }
    return selectionClauses[identifier] ? [selectionClauses[identifier]] : [];
  };
  let finalQuery = condition;
  // Handle complex conditions like '1 of selection_*' or 'all of them'
  const oneOfMatch = condition.match(/1 of (them|.+)/);
  const allOfMatch = condition.match(/all of (them|.+)/);
  if (oneOfMatch) {
    const target = oneOfMatch[1] === 'them' ? selections.join('|') : oneOfMatch[1];
    const identifiers = target.split('|').map(s => s.trim());
    const clauses = identifiers.flatMap(getClausesForIdentifier);
    finalQuery = clauses.join(' or ');
  } else if (allOfMatch) {
    const target = allOfMatch[1] === 'them' ? selections.join('|') : allOfMatch[1];
    const identifiers = target.split('|').map(s => s.trim());
    const clauses = identifiers.flatMap(getClausesForIdentifier);
    finalQuery = clauses.join(' and ');
  } else {
    // Simple replacement for conditions like 'selection and not filter'
    // Sort by length descending to replace longer names first (e.g., 'selection_v2' before 'selection')
    const sortedSelections = [...selections].sort((a, b) => b.length - a.length);
    for (const selection of sortedSelections) {
      // Use a regex to replace whole words only
      const regex = new RegExp(`\\b${selection}\\b`, 'g');
      finalQuery = finalQuery.replace(regex, selectionClauses[selection]);
    }
  }
  // Basic cleanup
  return finalQuery.replace(/\s\s+/g, ' ').trim();
}