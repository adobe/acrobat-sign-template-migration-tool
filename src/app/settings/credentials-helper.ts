/* Prefix each key name with 'source' or 'dest', and preserve camelCase. */
export function getSourceDestCredentials(credentials: Record<string, string>, sourceOrDest: 'source' | 'dest'): Record<string, string> {
    const credentialsCopy = JSON.parse(JSON.stringify(credentials)); // use a copy since JS args are passed by reference
  
    const keys = Object.keys(credentialsCopy);
    for (const key of keys) {
      const newKey: string = sourceOrDest + key.substring(0, 0 + 1).toUpperCase() + key.substring(1);
      credentialsCopy[newKey] = credentialsCopy[key];
      delete credentialsCopy[key];
    }

    return credentialsCopy;
}
  
export function getCredentials(sourceCredentials: Record<string, string>, destCredentials: Record<string, string>): Record<string, string> {
    return {...getSourceDestCredentials(sourceCredentials, 'source'), ...getSourceDestCredentials(destCredentials, 'dest')};
}