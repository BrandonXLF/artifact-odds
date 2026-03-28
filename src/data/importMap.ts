import { AnyStat, mainStats } from "../../logic/data";

export const importMap: Record<string, AnyStat> = {
	"FIGHT_PROP_HP": "HP",
	"FIGHT_PROP_ATTACK": "ATK",
	"FIGHT_PROP_DEFENSE": "DEF",
	"FIGHT_PROP_HP_PERCENT": "HP%",
	"FIGHT_PROP_ATTACK_PERCENT": "ATK%",
	"FIGHT_PROP_DEFENSE_PERCENT": "DEF%",
	"FIGHT_PROP_CHARGE_EFFICIENCY": "ER%",
	"FIGHT_PROP_ELEMENT_MASTERY": "EM",
	"FIGHT_PROP_CRITICAL": "CRIT Rate%",
	"FIGHT_PROP_CRITICAL_HURT": "CRIT DMG%",
	"FIGHT_PROP_FIRE_ADD_HURT": "Pyro DMG Bonus%",
	"FIGHT_PROP_WATER_ADD_HURT": "Hydro DMG Bonus%",
	"FIGHT_PROP_WIND_ADD_HURT": "Anemo DMG Bonus%",
	"FIGHT_PROP_ELEC_ADD_HURT": "Electro DMG Bonus%",
	"FIGHT_PROP_GRASS_ADD_HURT": "Dendro DMG Bonus%",
	"FIGHT_PROP_ICE_ADD_HURT": "Cryo DMG Bonus%",
	"FIGHT_PROP_PHYSICAL_ADD_HURT": "Physical DMG Bonus%",
	"FIGHT_PROP_ROCK_ADD_HURT": "Geo DMG Bonus%",
	"FIGHT_PROP_HEAL_ADD": "Healing Bonus%"
};

export const typeMap: Record<string, keyof typeof mainStats> = {
	"EQUIP_BRACER": 0,
	"EQUIP_NECKLACE": 1,
	"EQUIP_SHOES": 2,
	"EQUIP_RING": 3,
	"EQUIP_DRESS": 4
};
