import { ComponentChild } from "preact";
import { useContext } from "preact/hooks";
import { GameContext } from "../../contexts/GameContext";
import { ensureTitle } from "../..";
import Article from "../structure/Article";

export const InfoMain = (props: { title: string, content: ComponentChild }) => {
	const { gameMeta } = useContext(GameContext);

	const onBack = (e: MouseEvent) => {
		if (new URL(window.document.referrer).origin === window.location.origin && !window.opener.closed) {
			e.preventDefault();
			window.close();
		}
	};

	ensureTitle(`${props.title} | ${gameMeta.title}`);

	return <div>
		<nav className="mb-5">
			<a href={`/${gameMeta.url}/`} onClick={onBack}>&larr; Back to Form</a>
		</nav>
		<Article title={props.title}>
			{props.content}
		</Article>
	</div>;
}