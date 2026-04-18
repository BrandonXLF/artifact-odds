export const DocumentLink = ({ name, children }: { name: string; children: preact.ComponentChildren }) => {
	return <a href={`/artifact-copium/documents/${name}`} target="arp-document">{children}</a>
}
