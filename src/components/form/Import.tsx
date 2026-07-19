import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { genshinTypeMap, genshinMainStats, genshinSubstats, hsrMainStats, hsrSubstats } from "../../data/importMap";
import { ToggleButtons } from "../input/ToggleButtons";
import { VisualSection } from "../structure/VisualSection";
import { Button } from "../input/Button";
import { useStoredState } from "../../hooks/resettableState";
import { ImportedCharacter } from "./ImportedCharacter";
import { GameContext } from "../../contexts/GameContext";
import { Game } from "../../data/game";
import { round2 } from "../../utils/round";
import { data as allGameData } from "../../data/data";
import { RefObject } from "preact";

export interface ImportedArtifact {
	totalCount: number;
	icon: string;
	artifactType: number;
	mainStat: string;
	subStats: Record<string, number>;
	initial?: Record<string, number>;
}

interface EquippedCharacter {
	id: number;
	artifacts: ImportedArtifact[];
}

let resourcePromises: Record<string, Promise<unknown>> = {};
const getResource = async <T,>(url: string) => {
	resourcePromises[url] ??= fetch(url).then(res => res.json()) as Promise<T>;
	return resourcePromises[url] as Promise<T>;
};

type ProfileDataGenshin = {
	playerInfo: {
		nickname: string;
	};
	avatarInfoList: {
		avatarId: number;
		equipList: {
			reliquary?: {
				mainPropId: number;
				appendPropIdList: number[];
			};
			flat: {
				equipType: number;
				icon: string;
			}
		}[];
	}[];
};

type ProfileDataHSR = {
	detailInfo: {
		nickname: string;
		avatarDetailList: {
			avatarId: number;
			relicList: {
				type: number;
				tid: string;
				mainAffixId: number;
				subAffixList: {
					affixId: number;
					cnt: number;
					step?: number;
				}[]
			}[]
		}[];
	}
};

type AvatarResourceGenshin = Record<string, { NameTextMapHash: string; SideIconName: string; } | undefined>;
type AvatarResourceHSR = Record<string, { AvatarName: { Hash: string; }; AvatarSideIconPath: string; } | undefined>;
type LocResource = { en: Record<string, string | undefined> };

type Importer<T, U extends Array<unknown>, V> = {
	getUrl: (uid: string) => string;
	getNickname: (data: T) => string;
	additionalResources?: string[];
	getArtifacts: (data: T, ...iconResource: U) => EquippedCharacter[];
	avatarResourceUrl: string;
	locResourceUrl: string;
	getAvatar: (avatarResource: V, locResource: LocResource, avatarId: number) => string;
	getIconPath: (avatarResource: V, avatarId: number) => string | undefined;
};

const importers: {
	genshin: Importer<ProfileDataGenshin, [], AvatarResourceGenshin>;
	hsr: Importer<ProfileDataHSR, [{ Items: Record<string, { Icon: string }> }], AvatarResourceHSR>;
} = {
	genshin: {
		getUrl: (uid: string) => `https://www.brandonfowler.me/enka-proxy/uid/${uid}`,
		getNickname: (data: ProfileDataGenshin) => data.playerInfo.nickname,
		getArtifacts: (data: ProfileDataGenshin) => data.avatarInfoList.map(avatar => ({
			id: avatar.avatarId,
			artifacts: avatar.equipList
				.filter(equipment => equipment.reliquary)
				.map(artifact => {
					const subStats: Record<string, number> = {};
					const initial: Record<string, number> = {};
					let initialCount = 0;

					for (const subPropId of artifact.reliquary!.appendPropIdList) {
						const [stat, value] = genshinSubstats.get(subPropId)!;
						subStats[stat] = (subStats[stat] ?? 0) + value;

						if (initialCount < 4) {
							initial[stat] = value;
							initialCount++;
						}
					}

					return {
						totalCount: artifact.reliquary!.appendPropIdList.length,
						icon: `https://enka.network/ui/${artifact.flat.icon}.png`,
						artifactType: genshinTypeMap[artifact.flat.equipType] as number,
						mainStat: genshinMainStats.get(artifact.reliquary!.mainPropId)!,
						subStats,
						initial
					};
				})
		})),
		avatarResourceUrl: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/avatars.json',
		locResourceUrl: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/gi/locs.json',
		getAvatar: (avatarResource: AvatarResourceGenshin, locResource: LocResource, avatarId: number) => {
			const nameHash = avatarResource[avatarId]?.NameTextMapHash;
			return (nameHash && locResource.en[nameHash]) || avatarId.toString();
		},
		getIconPath: (avatarResource: AvatarResourceGenshin, avatarId: number) =>
			avatarResource[avatarId]?.SideIconName.replace('_Side', '')
	},
	hsr: {
		getUrl: (uid: string) => `https://www.brandonfowler.me/enka-proxy/hsr/uid/${uid}`,
		getNickname: (data: ProfileDataHSR) => data.detailInfo.nickname,
		additionalResources: [
			'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/hsr/relics.json'
		],
		getArtifacts: (data: ProfileDataHSR, iconResource: { Items: Record<string, { Icon: string }> }) =>
			data.detailInfo.avatarDetailList.map(avatar => ({
				id: avatar.avatarId,
				artifacts: avatar.relicList.map(artifact => {
					return {
						totalCount: artifact.subAffixList.reduce((sum, affix) => sum + affix.cnt, 0),
						icon: `https://enka.network/${iconResource.Items[artifact.tid]?.Icon}`,
						artifactType: artifact.type - 1,
						mainStat: hsrMainStats.get(`${artifact.type - 1}_${artifact.mainAffixId}`)!,
						subStats: Object.fromEntries(artifact.subAffixList.map(subStat => {
							const stat = hsrSubstats.get(subStat.affixId)!;
							const rollValues = allGameData.hsr.rollValueOverrides?.[stat]?.rollValues ?? allGameData.hsr.rollValues;
							const cntVal = rollValues[0];
							const stepVal = (rollValues[1] - rollValues[0]);
							const val = subStat.cnt * cntVal + (subStat.step ?? 0) * stepVal;

							return [stat, val];
						}))
					};
				})
			})),
		avatarResourceUrl: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/hsr/avatars.json',
		locResourceUrl: 'https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/hsr/hsr.json',
		getAvatar: (avatarResource: AvatarResourceHSR, locResource: LocResource, avatarId: number) => {
			const nameHash = avatarResource[avatarId]?.AvatarName.Hash;
			return (nameHash && locResource.en[nameHash]) || avatarId.toString();
		},
		getIconPath: (avatarResource: AvatarResourceHSR, avatarId: number) =>
			avatarResource[avatarId]?.AvatarSideIconPath
	}
};

export const Import = (props: {
	import: (art: ImportedArtifact) => void,
	close: () => void,
	elementRef?: RefObject<HTMLDivElement>
}) => {
	const { game, gameData } = useContext(GameContext);
	const abort = useRef<AbortController | null>(null);
	const [characterIndex, setCharacterIndex] = useState(0);
	const [uid, setUid] = useStoredState<string>("importUid", "");
	const [loadedGame, setLoadedGame] = useState<Game | null>(null);
	const [profileName, setProfileName] = useState("");
	const [loaded, setLoaded] = useState<EquippedCharacter[]>([]);
	const importer = importers[game];
	const [nameResources, setNameResources] = useState<[any, LocResource]>([{}, {en: {}}]);

	const loadProfile = async () => {
		abort.current?.abort();
		abort.current = new AbortController();

		const [res, ...resources] = await Promise.all([
			fetch(importer.getUrl(uid || ""), {
				signal: abort.current.signal
			}),
			...(importer.additionalResources?.map(getResource) ?? [])
		]);

		const data = await res.json();

		setLoadedGame(game);
		setProfileName(importer.getNickname(data));
		setLoaded(importer.getArtifacts(data, ...resources as any[]));
	}

	if (loadedGame !== null && loadedGame !== game) {
		setLoadedGame(null);
		setProfileName("");
		setLoaded([]);
		setCharacterIndex(0);
	}

	useEffect(() => {
		(async () => {
			setNameResources(await Promise.all([
				getResource<Parameters<typeof importer["getAvatar"]>[0]>(importer.avatarResourceUrl),
				getResource<LocResource>(importer.locResourceUrl)
			]));
		})();
	}, [game]);

	return <VisualSection elementRef={props.elementRef}>
		<div class="flex gap-x-2 gap-y-4 flex-wrap-reverse">
			<div class="flex items-center gap-2 flex-wrap">
				<label class="contents">
					<span>UID:</span>
					<input class="flex-1 max-w-40" type="text" value={uid} onInput={e => setUid(e.currentTarget.value)} />
				</label>
				<Button onClick={loadProfile}>Load Profile</Button>
				{profileName && <span>{profileName}</span>}
			</div>
			<div class="flex-1 text-right">
				<Button onClick={props.close}>Close</Button>
			</div>
		</div>
		{loaded.length > 0 && <div class="mt-4">
			<ToggleButtons
				options={loaded.map((c, i) => [i, <ImportedCharacter<any, LocResource>
					key={c.id}
					avatarResource={nameResources[0]}
					locResource={nameResources[1]}
					getNickname={importer.getAvatar}
					getIconPath={importer.getIconPath}
					avatarId={c.id}
				/>])}
				value={characterIndex}
				onChange={setCharacterIndex}
				noShrink
			/>
		</div>}
		{loaded[characterIndex] && <div class="mt-4">
			<div class="flex gap-4 flex-wrap shrink-0">
				{loaded[characterIndex].artifacts.map(a => (
					<Button
						key={a.icon}
						class="text-left min-w-30 px-3 py-1 flex items-start flex-col relative"
						onClick={() => props.import(a)}
					>
						<img src={a.icon} alt="" class="absolute right-0 top-0 w-12 mask-b-from-0" />
						<p class="font-bold z-2 text-shadow-(color:--bg) text-shadow-lg">{a.mainStat}</p>
						<ul class="z-2 text-shadow-(color:--bg) text-shadow-lg">
							{Object.entries(a.subStats).map(([stat, value]) => (
								<li key={stat}>{stat}: {round2(value * gameData.statValues[stat])}</li>
							))}
						</ul>
					</Button>
				))}
			</div>
		</div>}
		<div class="mt-2">
			Sourced from <a href="https://enka.network/" target="_blank">Enka.Network</a>
		</div>
	</VisualSection>
};
