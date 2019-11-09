/**
 * Parse ingredient strings, convert amounts/units
 */
var Ingredi = {

	/**
	 * Convert common units/abbreviations to a standardized format
	 * @param  {string} unit
	 * @return {string}
	 */
	formatUnit: function(unit) {

		// todo: remove trailing . (tsp. vs tsp)

		// first check for t vs T (only unit where capitalization matters)
		if (unit == 't') {
			return 'tsp';
		} else if (unit == 'T') {
			return 'tbsp';
		}

		switch (unit.toLowerCase()) {
			case 'tsp':
			case 'teaspoon':
			case 'teaspoons':
				return 'tsp';
			case 'tbl':
			case 'tbs':
			case 'tbsp':
			case 'tablespoon':
			case 'tablespoons':
				return 'tbsp';
			case 'oz':
			case 'ounce':
			case 'ounces':
			// todo: we often write oz for fluid ounces - how to tell if oz should be volume or weight?
			case 'floz':
			case 'fl oz':
			case 'fluid oz':
			case 'fluid ounce':
			case 'fluid ounces':
				return 'oz';
			case 'c':
			case 'cup':
			case 'cups':
				return 'c';
			case 'pt':
			case 'pint':
			case 'pints':
				return 'pt';
			case 'qt':
			case 'quart':
			case 'quarts':
				return 'qt';
			case 'gal':
			case 'gallon':
			case 'gallons':
				return 'gal';
			// todo: metric units
			// todo: weight units
			default:
				return unit;
		}
	},

	/**
	 * Convert an amount from one unit to another
	 * If the unit to convert to is not passed in the options,
	 * automatically choose a unit that makes sense based on the amount
	 * @param  {number} amount
	 * @param  {string} unit
	 * @param  {object} options
	 * @return {object}
	 */
	convertUnit: function(amount, unit, options = null) {

		// first standardize unit format
		unit = this.formatUnit(unit);

		// volume conversion map
		let volumeMap = {
			'tsp': 16 * 3, // 3 tsp = 1 tbsp
			'tbsp': 16,
			'oz': 16 / 2, // 1/2 fl oz = 1 tbsp
			'c': 1,
			'pt': 1/2,
			'qt': 1/4,
			'gal': 1/16,
		};

		// todo: dry ingredient volume to weight
		// todo: fl oz (volume) vs. oz (weight)

		let newAmount, newUnit;

		// only convert units that are in our map
		if (volumeMap.hasOwnProperty(unit)) {

			let amountInCups = amount / volumeMap[unit];

			// if a valid unit to convert to was passed in options, use that
			if (options && options.to && volumeMap.hasOwnProperty(options.to)) {
				newUnit = options.to;
			// attempt to auto convert to unit that makes the most sense based on amount
			} else {

				// if >= 8 c (2 qt), use qt
				if (amountInCups >= 8) {
					newUnit = 'qt';
				// if < 1/4 c (4 tbsp), use tbsp or tsp
				} else if (amountInCups < 1/4) {
					// if < 1 tbsp (3 tsp), use tsp
					if (amountInCups < 1/16) {
						newUnit = 'tsp';
					// if >= 3 tsp (1 tbsp), use tbsp
					} else {
						newUnit = 'tbsp';
					}
				// if >= 4 tbsp (1/4 c) or < 2 qt (8 c), use c
				} else {
					newUnit = 'c';
				}
			}

			// calulate new amount based on new unit
			newAmount = amountInCups * volumeMap[newUnit];

		// if unit is not in our map, do not convert
		} else {
			newAmount = amount;
			newUnit = unit;
		}

		return {
			amount: newAmount,
			unit: newUnit,
			string: `${newAmount} ${newUnit}`,
		};
	},

	/**
	 * Replace amounts in a string with new amounts multiplied by a number
	 * (to get ingredient amounts for half, double, etc. recipe)
	 * @param  {string} original
	 * @param  {number} multiplier
	 * @param  {object} options
	 * @return {string} : new string with original amounts replaced with converted amounts
	 */
	multiplyAmount: function(original, multiplier, options = null) {
		// regex for formats 1, 1/2, 1 1/2, or 0.5 followed by a unit
		let regex = new RegExp(/((\d+ )?(\d+)(([\/\.])(\d+))?) ?([a-zA-Z]+)/, 'g');

		let converted = original.replace(regex, (match, p1, p2, p3, p4, p5, p6, p7, offset, string) => {

			let amount = p1;
			let unit = p7;
			let sep = p5;

			let newAmount;

			// handle fraction
			if (sep == '/') {
				let whole = p2 ? parseInt(p2) : 0;
				let numerator = p3;
				let denominator = p6;
				newAmount = (whole + numerator/denominator) * multiplier;
				// todo: convert back to fraction?
			} else {
				newAmount = amount * multiplier;
			}

			return this.convertUnit(newAmount, unit).string;
		});

		return converted;
	},

}
