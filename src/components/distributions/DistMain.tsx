import { useContext } from "preact/hooks";
import { Distribution } from "../../data/distributions";
import { GameContext } from "../../contexts/GameContext";
import Article from "../Article";

export const DistMain = ({ dist }: { dist?: Distribution }) => {
	const { gameMeta } = useContext(GameContext);

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