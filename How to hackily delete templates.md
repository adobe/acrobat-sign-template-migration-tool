# How to hackily delete templates

First, change this code in `oauth.service.ts`

```typescript
else { // complianceLevel.includes('gov')
	return 'library_read';
}
```

to this:

```typescript
else { // complianceLevel.includes('gov')
	return 'library_read library_write';
}
```

Then, copy-paste this code and put it in-between the code blocks commented by `/* Initalize documentIds. */` and `/* Set up the FormArray that will be used to display the list of documents to the user. */` in `migration-console.component.ts`:

```typescript
for (const doc of oldThis.documentIds) {
    const requestConfig2 =
    {
      'method': 'put',
      'url': `${baseUrl}/libraryDocuments/${doc}/state`,
      'headers': {'Authorization': `Bearer ${this.sourceBearerToken}`},
      'data': { 'state': 'REMOVED' }
    };
    console.log(requestConfig2);
    await httpRequest(requestConfig2);
}
```

You may want to delete documents that satisfy certain criteria. To hackily do this as well...

## How to hackily filter templates to be deleted

In `migration-console.component.ts`, change this line of code

```typescript
libraryDocuments = libraryDocuments.concat(response.libraryDocumentList);
```

to this:

```typescript
const filteredNewDocs = response.libraryDocumentList.filter(condition);
      libraryDocuments = libraryDocuments.concat(filteredNewDocs);
```

Where `condition` is a callback function such as

```typescript
function condition(doc: any) {
	return doc.ownerEmail === 'some.email@adobe.com';
}
```

