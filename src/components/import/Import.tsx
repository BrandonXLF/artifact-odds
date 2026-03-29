import { useEffect, useRef, useState } from "preact/hooks";
import { importMap, typeMap } from "../../data/importMap";
import { ToggleButtons } from "../ToggleButtonts";
import { Section } from "../Section";
import { Button } from "../Button";
import { useStoredState } from "../../utils/resettableState";
import { AnyStat, SubStat } from "../../../logic/data";
import { ImportedCharacter } from "./ImportedCharacter";

interface ImportedArtifact {
	propIdCount: number;
	icon: string;
	artifactType: number;
	mainStat: AnyStat;
	subStats: [SubStat, number][];
}

interface EquippedCharacter {
	id: number;
	artifacts: ImportedArtifact[];
}

export type NameResources = [
	Record<string, {
		Element: string,
		NameTextMapHash: string;
		SideIconName: string;
	} | undefined>,
	{ en: Record<string, string | undefined> }
];

let nameResourcesPromise: Promise<NameResources> | null = null;

export const getNameResources = () => {
	nameResourcesPromise ??= (async () => {
		try {
			return Promise.all([
				(await fetch('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/avatars.json')).json(),
				(await fetch('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/locs.json')).json()
			]);
		} catch {
			return [{}, {en: {}}];
		}
	})();

	return nameResourcesPromise;
}

export const Import = (props: { import: (art: ImportedArtifact) => void }) => {
	const abort = useRef<AbortController | null>(null);
	const [nameResources, setNamesResources] = useState<NameResources>([{}, {en: {}}]);
	const [characterIndex, setCharacterIndex] = useState(0);
	const [uid, setUid] = useStoredState<string>("importUid", "");
	const [profileName, setProfileName] = useState("");
	const [loaded, setLoaded] = useState<EquippedCharacter[]>([]);

	useEffect(() => {
		(async () => {
			setNamesResources(await getNameResources());
		})();
	}, []);


	const loadProfile = async () => {
		abort.current?.abort();
		abort.current = new AbortController();

		const res = await fetch(`https://www.brandonfowler.me/enka-proxy/uid/${uid}`, {
			signal: abort.current.signal
		});

		const data = await res.json() as {
			playerInfo: {
				nickname: string;
			};
			avatarInfoList: {
				avatarId: number;
				equipList: {
					reliquary?: {
						appendPropIdList: number[];
					};
					flat: {
						equipType: number;
						icon: string;
						reliquaryMainstat: {
							mainPropId: string;
						};
						reliquarySubstats: {
							appendPropId: string;
							statValue: number;
						}[];
					}
				}[];
			}[];
		};

		setProfileName(data.playerInfo.nickname);
		setLoaded(data.avatarInfoList.map(avatar => ({
			id: avatar.avatarId,
			artifacts: avatar.equipList
				.filter(equipment => equipment.reliquary)
				.map(artifact => ({
					propIdCount: artifact.reliquary!.appendPropIdList.length,
					icon: `https://enka.network/ui/${artifact.flat.icon}.png`,
					artifactType: typeMap[artifact.flat.equipType] as number,
					mainStat: importMap[artifact.flat.reliquaryMainstat.mainPropId],
					subStats: artifact.flat.reliquarySubstats.map(subStat => [
						importMap[subStat.appendPropId],
						subStat.statValue
					] as [SubStat, number])
				}))
		})));
	}

	return <Section>
		<div class="flex items-center gap-2">
			<label class="contents">
				<span>UID:</span>
				<input class="flex-1 max-w-40" type="text" value={uid} onInput={e => setUid(e.currentTarget.value)} />
			</label>
			<Button onClick={loadProfile}>Load Profile</Button>
			{profileName && <span>{profileName}</span>}
		</div>
		{loaded.length > 0 && <div class="mt-4">
			<ToggleButtons
				options={loaded.map(c => <ImportedCharacter nameResources={nameResources} avatarId={c.id} />)}
				value={characterIndex}
				onChange={setCharacterIndex}
				wrap
			/>
		</div>}
		{loaded[characterIndex] && <div class="mt-4">
			<div class="flex gap-4 flex-wrap shrink-0">
				{loaded[characterIndex].artifacts.map(a => (
					<Button class="text-left min-w-30 px-3 py-1 flex items-start flex-col relative" onClick={() => props.import(a)}>
						<img src={a.icon} alt="" class="absolute right-0 top-0 w-12 mask-b-from-0" />
						<p class="font-bold z-2 text-shadow-(color:--bg) text-shadow-lg">{a.mainStat}</p>
						<ul class="z-2 text-shadow-(color:--bg) text-shadow-lg">
							{a.subStats.map(s => <li>{s[0]}: {s[1]}</li>)}
						</ul>
					</Button>
				))}
			</div>
		</div>}
		<div class="mt-2">
			Sourced from <a href="https://enka.network/" target="_blank">Enka.Network</a>
		</div>
	</Section>
};
