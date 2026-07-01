export const DocumentLink = ({ name, children }: { name: string; children: preact.ComponentChildren }) => {
	return <a href={`/artifact-odds/documents/${name}`}>{children}</a>
}
