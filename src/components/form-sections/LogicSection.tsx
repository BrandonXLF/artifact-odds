import { useContext } from "preact/hooks";
import { distributions } from "../../data/distributions";
import { DocumentLink } from "../misc/DocumentLink";
import { LabelGrid } from "../structure/LabelGrid";
import { VisualSection } from "../structure/VisualSection";
import { GameContext } from "../../contexts/GameContext";

export const LogicSection = () => {
	const { gameMeta } = useContext(GameContext);

	return <VisualSection>
		<LabelGrid tight>
			<div>
				<div>Logic:</div>
				<div>
					<DocumentLink name="calculating-artifact-roll-outcomes.pdf">Overview of Logic</DocumentLink>
				</div>
			</div>
			<div>
				<div>Distribution viewers:</div>
				<div>
					{Object.entries(distributions).map(([key, { name }], i) => (
						<>{i === 0 ? "" : ", "}<a key={key} href={`/${gameMeta.url}/dist/${key}/`} target="arp-dist">{name}</a></>
					))}
				</div>
			</div>
		</LabelGrid>
	</VisualSection>;
}