import { ComponentChild } from "preact";
import { useContext } from "preact/hooks";
import { GameContext } from "../../contexts/GameContext";
import { ensureTitle } from "../..";
import Article from "../structure/Article";

export const InfoMain = (props: { path: string, title: string, content: ComponentChild }) => {
	const { gameMeta } = useContext(GameContext);

	ensureTitle(`${props.title} | ${gameMeta.title}`);

	return <div>
		<nav className="mb-5">
			<a href={`/${gameMeta.url}/`}>&larr; Back to form</a>
		</nav>
		<Article title={props.title}>
			{props.content}
		</Article>
	</div>;
}