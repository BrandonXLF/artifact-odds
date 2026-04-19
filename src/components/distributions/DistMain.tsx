import { useContext } from "preact/hooks";
import { Distribution } from "../../data/distributions";
import { GameContext } from "../../contexts/GameContext";
import Article from "../structure/Article";
import { ensureTitle } from "../..";

export const DistMain = ({ dist }: { dist?: Distribution }) => {
	const { gameMeta } = useContext(GameContext);

	ensureTitle(`${dist?.name ?? "Unknown"} Distribution Viewer | ${gameMeta.title}`);

	return <div>
		<nav className="mb-5">
			<a href={`/${gameMeta.url}`}>&larr; Back to Form</a>
		</nav>
		{dist
			? <Article title={`${dist.name} Distribution Viewer`}>
				{dist.component()}
			</Article>
			: <div>Distribution not found.</div>
		}
	</div>;
}