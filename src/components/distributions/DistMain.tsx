import { Distribution } from "../../data/distributions";
import { InfoMain } from "../misc/InfoMain";

export const DistMain = ({ dist }: { dist?: Distribution }) => {
	return <InfoMain
		title={`${dist?.name ?? "Unknown"} Distribution Viewer`}
		content={dist ? dist.component() : <div>Distribution not found.</div>}
	/>;
}