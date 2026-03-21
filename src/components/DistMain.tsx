import { Distribution } from "../distributions";

export const DistMain = ({ dist }: { dist: Distribution }) => {
	return (
		<div>
			<h2 class="text-xl font-bold mb-4">{dist.name} Distribution Viewer</h2>
			{dist.component()}
		</div>
	);
}