export const genshinTypeMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
	"EQUIP_BRACER": 0,
	"EQUIP_NECKLACE": 1,
	"EQUIP_SHOES": 2,
	"EQUIP_RING": 3,
	"EQUIP_DRESS": 4
};

export const genshinSubstats = new Map<number, [string, number]>([
	[ 501021, [ 'HP', 70 ] ],
	[ 501022, [ 'HP', 80 ] ],
	[ 501023, [ 'HP', 90 ] ],
	[ 501024, [ 'HP', 100 ] ],
	[ 501031, [ 'HP%', 70 ] ],
	[ 501032, [ 'HP%', 80 ] ],
	[ 501033, [ 'HP%', 90 ] ],
	[ 501034, [ 'HP%', 100 ] ],
	[ 501051, [ 'ATK', 70 ] ],
	[ 501052, [ 'ATK', 80 ] ],
	[ 501053, [ 'ATK', 90 ] ],
	[ 501054, [ 'ATK', 100 ] ],
	[ 501061, [ 'ATK%', 70 ] ],
	[ 501062, [ 'ATK%', 80 ] ],
	[ 501063, [ 'ATK%', 90 ] ],
	[ 501064, [ 'ATK%', 100 ] ],
	[ 501081, [ 'DEF', 70 ] ],
	[ 501082, [ 'DEF', 80 ] ],
	[ 501083, [ 'DEF', 90 ] ],
	[ 501084, [ 'DEF', 100 ] ],
	[ 501091, [ 'DEF%', 70 ] ],
	[ 501092, [ 'DEF%', 80 ] ],
	[ 501093, [ 'DEF%', 90 ] ],
	[ 501094, [ 'DEF%', 100 ] ],
	[ 501201, [ 'CRIT Rate%', 70 ] ],
	[ 501202, [ 'CRIT Rate%', 80 ] ],
	[ 501203, [ 'CRIT Rate%', 90 ] ],
	[ 501204, [ 'CRIT Rate%', 100 ] ],
	[ 501221, [ 'CRIT DMG%', 70 ] ],
	[ 501222, [ 'CRIT DMG%', 80 ] ],
	[ 501223, [ 'CRIT DMG%', 90 ] ],
	[ 501224, [ 'CRIT DMG%', 100 ] ],
	[ 501231, [ 'ER%', 70 ] ],
	[ 501232, [ 'ER%', 80 ] ],
	[ 501233, [ 'ER%', 90 ] ],
	[ 501234, [ 'ER%', 100 ] ],
	[ 501241, [ 'EM', 70 ] ],
	[ 501242, [ 'EM', 80 ] ],
	[ 501243, [ 'EM', 90 ] ],
	[ 501244, [ 'EM', 100 ] ]
]);

export const genshinMainStats = new Map<number, string>([
	// Sands
	[ 10002, 'HP%' ],
	[ 10004, 'ATK%' ],
	[ 10006, 'DEF%' ],
	[ 10007, 'ER%' ],
	[ 10008, 'EM' ],

	// Feather
	[ 12001, 'ATK' ],

	// Circlet
	[ 13002, 'HP%' ],
	[ 13004, 'ATK%' ],
	[ 13006, 'DEF%' ],
	[ 13007, 'CRIT Rate%' ],
	[ 13008, 'CRIT DMG%' ],
	[ 13009, 'Healing Bonus%' ],
	[ 13010, 'EM' ],

	// Flower
	[ 14001, 'HP' ],

	// Goblet
	[ 15002, 'HP%' ],
	[ 15004, 'ATK%' ],
	[ 15006, 'DEF%' ],
	[ 15007, 'EM' ],
	[ 15008, 'Pyro DMG Bonus%' ],
	[ 15009, 'Electro DMG Bonus%' ],
	[ 15010, 'Cryo DMG Bonus%' ],
	[ 15011, 'Hydro DMG Bonus%' ],
	[ 15012, 'Anemo DMG Bonus%' ],
	[ 15013, 'Geo DMG Bonus%' ],
	[ 15014, 'Dendro DMG Bonus%' ],
	[ 15015, 'Physical DMG Bonus%' ]
]);

export const hsrSubstats = new Map<number, string>([
	[ 1, 'HP' ],
	[ 2, 'ATK' ],
	[ 3, 'DEF' ],
	[ 4, 'HP%' ],
	[ 5, 'ATK%' ],
	[ 6, 'DEF%' ],
	[ 7, 'SPD' ],
	[ 8, 'CRIT Rate%' ],
	[ 9, 'CRIT DMG%' ],
	[ 10, 'EHR%' ],
	[ 11, "Effect RES%" ],
	[ 12, 'Break Effect%' ]
]);

export const hsrMainStats = new Map<string, string>([
	// Head
	[ '0_1', 'HP' ],

	// Hands
	[ '1_1', 'ATK' ],

	// Body
	[ '2_1', 'HP%' ],
	[ '2_2', 'ATK%' ],
	[ '2_3', 'DEF%' ],
	[ '2_4', 'CRIT Rate%' ],
	[ '2_5', 'CRIT DMG%' ],
	[ '2_6', 'OHB%' ],
	[ '2_7', 'EHR%' ],

	// Feet
	[ '3_1', 'HP%' ],
	[ '3_2', 'ATK%' ],
	[ '3_3', 'DEF%' ],
	[ '3_4', 'SPD' ],

	// Sphere
	[ '4_1', 'HP%' ],
	[ '4_2', 'ATK%' ],
	[ '4_3', 'DEF%' ],
	[ '4_4', 'Physical DMG Boost%' ],
	[ '4_5', 'Fire DMG Boost%' ],
	[ '4_6', 'Ice DMG Boost%' ],
	[ '4_7', 'Lightning DMG Boost%' ],
	[ '4_8', 'Wind DMG Boost%' ],
	[ '4_9', 'Quantum DMG Boost%' ],
	[ '4_10', 'Imaginary DMG Boost%' ],

	// Rope
	[ '5_1', 'Break Effect%' ],
	[ '5_2', 'ERR%' ],
	[ '5_3', 'HP%' ],
	[ '5_4', 'ATK%' ],
	[ '5_5', 'DEF%' ]
]);
