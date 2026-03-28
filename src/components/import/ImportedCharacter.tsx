import { NameResources } from "./Import";

export const ImportedCharacter = (props: {
	nameResources: NameResources;
	avatarId: number
}) => {
	const nameHash = props.nameResources[0][props.avatarId]?.NameTextMapHash;
	const name = (nameHash && props.nameResources[1].en[nameHash]) || props.avatarId.toString();
	const icon = props.nameResources[0][props.avatarId]?.SideIconName.replace('_Side', '');

	return <div class="flex items-center gap-2">
		{icon && <img src={`https://enka.network/${icon}`} alt={name} class="w-6 aspect-square" />}
		<div>{name}</div>
	</div>;
}
