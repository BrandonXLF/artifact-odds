
export const ImportedCharacter = <T, U>(props: {
	avatarResource: T;
	locResource: U;
	getNickname: (avatarResource: T, locResource: U, avatarId: number) => string;
	getIconPath: (avatarResource: T, avatarId: number) => string | undefined;
	avatarId: number
}) => {
	const name = props.getNickname(props.avatarResource, props.locResource, props.avatarId).replace(/<unbreak>(.*?)<\/unbreak>/g, "$1");
	const icon = props.getIconPath(props.avatarResource, props.avatarId);

	return <div class="flex items-center gap-2">
		{icon && <img src={`https://enka.network/${icon}`} alt={name} class="w-6 aspect-square" />}
		<div>{name}</div>
	</div>;
}
