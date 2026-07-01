import { useContext, useMemo } from "preact/hooks";
import { Percentage } from "./output/Percentage";
import { GameContext } from "../contexts/GameContext";
import { InfoMain } from "./misc/InfoMain";
import { BasicUnitOutput, modes } from "../data/modes";

const ProbTable = ({ children }: { children: preact.ComponentChildren }) => {
	return <div>
		<div
			className="border border-primary p-2 w-max rounded-lg"
			style="background: linear-gradient(315deg, color-mix(in lab, #383838, var(--color-primary-dark) 25%), #383838);"
		>
			<table class="leading-6 w-full [&_th]:text-left [&_td,&_th]:px-2 [&_td,&_th]:first:pl-0 [&_td,&_th]:last:pr-0">
				{children}
			</table>
		</div>
	</div>;
}

const Assumptions = () => {
	const { game, gameData } = useContext(GameContext);

	const sortedStatWeights = useMemo(() => {
		return Object.entries(gameData.statWeights).sort((a, b) => b[1] - a[1]);
	}, [gameData.statWeights]);

	const assumedOutputs = Object.values(modes[game])
		.flatMap(mode => Array.isArray(mode.output) ? mode.output.map(o => [o, mode.name] as const) : [[mode.output, mode.name]] as const)
		.filter((info): info is [BasicUnitOutput, string] => 'desc' in info[0]);

	return <div>
		<section>
			<h3 class="text-xl font-bold mt-5">Output Quantities</h3>
			<ul class="my-5 list-disc list-inside">
				{assumedOutputs.length > 0 && assumedOutputs.map(([output, modeName]) =>
					<li key={output.unit.label} class="my-5"><strong>{output.unit.label}</strong>  ({modeName}): {output.desc}</li>
				)}
			</ul>
		</section>
		<section>
			<h3 class="text-xl font-bold mt-5">4-Liner</h3>
			<ul class="my-5 list-disc list-inside">
				<li>
					Probability of getting a 4-liner from a domain: <Percentage value={gameData.allLinesDomainProb} />
				</li>
				<li>
					Probability of getting a 4-liner from crafting: <Percentage value={gameData.allLinesCraftedProb} />
				</li>
			</ul>
		</section>
		<section>
			<h3 class="text-xl font-bold mt-5">Main Stats</h3>
			<div class="my-5">
				{gameData.mainStats.map(mainStat => <div key={mainStat.name}>
					<h3 class="font-bold mt-4 mb-2">{mainStat.name}</h3>
					<ProbTable>
						<thead>
							<tr>
								<th>Main Stat</th>
								<th>Probability</th>
							</tr>
						</thead>
						<tbody>
							{Object.entries(mainStat.stats).map(([stat, prob]) => <tr key={stat}>
								<td>{stat}</td>
								<td><Percentage value={prob} /></td>
							</tr>)}
						</tbody>
					</ProbTable>
				</div>)}
			</div>
		</section>
		<section>
			<h3 class="text-xl font-bold mt-5">Sub-Stat Weights</h3>
			<div class="my-5">
				<ProbTable>
					<thead>
						<tr>
							<th>Sub-Stat</th>
							<th>Weight</th>
						</tr>
					</thead>
					<tbody>
						{sortedStatWeights.map(([stat, weight]) => <tr key={stat}>
							<td>{stat}</td>
							<td>{weight}</td>
						</tr>)}
					</tbody>
				</ProbTable>
			</div>
		</section>
	</div>;
}

export const AssumptionsMain = () => {
	return <InfoMain path="assumptions" title="Assumed Probabilities" content={<Assumptions />} />;
}
