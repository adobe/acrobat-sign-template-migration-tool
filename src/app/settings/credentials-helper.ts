/* Prefix each key name with 'source' or 'dest', and preserve camelCase. */
export function getSourceDestCredentials(credentials: Record<string, string>, sourceOrDest: 'source' | 'dest'): Record<string, string> {
    const keys = Object.keys(credentials);
    for (const element of keys) {
      const key: string = element;
      const newKey: string = sourceOrDest + key.substring(0, 0 + 1).toUpperCase() + key.substring(1);
      credentials[newKey] = credentials[key];
      delete credentials[key];
    }

    return credentials;
}
  
export function getCredentials(sourceCredentials: Record<string, string>, destCredentials: Record<string, string>): Record<string, string> {
    return {...getSourceDestCredentials(sourceCredentials, 'source'), ...getSourceDestCredentials(destCredentials, 'dest')};
}