import { distributions } from "../distributions";
import { DocumentLink } from "./DocumentLink";
import { LabelGrid } from "./LabelGrid";
import { Section } from "./Section";

export const LogicSection = () => {
	return <Section>
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
						<>{i === 0 ? "" : ", "}<a key={key} href={`./?dist=${key}`} target="arp-dist">{name}</a></>
					))}
				</div>
			</div>
		</LabelGrid>
	</Section>;
}