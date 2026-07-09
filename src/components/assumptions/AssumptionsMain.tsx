import { InfoMain } from "../misc/InfoMain";
import { Assumptions } from "./Assumptions";

export const AssumptionsMain = () => {
	return <InfoMain path="assumptions" title="Assumed Probabilities" content={<Assumptions />} />;
}
