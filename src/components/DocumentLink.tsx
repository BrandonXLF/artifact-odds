export const DocumentLink = ({ name, children }: { name: string; children: preact.ComponentChildren }) => {
	return <a href={`./documents/${name}`} target="arp-document">{children}</a>
}
