export const importMap: Record<string, string> = {
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

export const typeMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
	"EQUIP_BRACER": 0,
	"EQUIP_NECKLACE": 1,
	"EQUIP_SHOES": 2,
	"EQUIP_RING": 3,
	"EQUIP_DRESS": 4
};

export const hsrImportMap: Record<string, string> = {
	// Sub-stats
	"HPDelta": "HP",
	"DefenceDelta": "DEF",
	"AttackDelta": "ATK",
	"HPAddedRatio": "HP%",
	"DefenceAddedRatio": "DEF%",
	"AttackAddedRatio": "ATK%",
	"CriticalDamage": "CRIT DMG%",
	"CriticalChance": "CRIT Rate%",
	"StatusProbability": "EHR%",
	"StatusResistance": "Effect RES%",
	"SpeedDelta": "SPD",
	"BreakDamageAddedRatio": "Break Effect%",

	// Main stats
	"CriticalDamageBase": "CRIT DMG%",
	"CriticalChanceBase": "CRIT Rate%",
	"StatusProbabilityBase": "EHR%",
	"HealRatioBase": "OHB%",
	"BreakDamageAddedRatioBase": "Break Effect%",
	"SPRatioBase": "ERR%",
	"PhysicalAddedRatio": "Physical DMG Boost%",
	"FireAddedRatio": "Fire DMG Boost%",
	"IceAddedRatio": "Ice DMG Boost%",
	"WindAddedRatio": "Wind DMG Boost%",
	"ThunderAddedRatio": "Lightning DMG Boost%",
	"QuantumAddedRatio": "Quantum DMG Boost%",
	"ImaginaryAddedRatio": "Imaginary DMG Boost%"
};
