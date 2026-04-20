import { distributions } from "../../data/distributions";
import { InfoMain } from "../misc/InfoMain";

export const DistMain = (props: { distKey: string }) => {
	const dist = distributions[props.distKey];

	return <InfoMain
		path={`dist/${props.distKey}`}
		title={`${dist?.name ?? "Unknown"} Distribution Viewer`}
		content={dist ? dist.component() : <div>Distribution not found.</div>}
	/>;
}