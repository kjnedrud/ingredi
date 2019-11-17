/**
 * Parse ingredient strings, convert amounts/units
 */
var Ingredi = {

	/**
	 * Parse amounts and units from a string
	 * @param  {string}
	 * @return {array|string}
	 */
	parse: function(string) {
		// regex for formats 1, 1/2, 1 1/2, or 0.5 followed by a unit
		// todo: handle special fraction chars like ½ - see http://unicodefractions.com/
		let regex = new RegExp(/((?:\d+ )?\d+(?:[\/\.]\d+)?) ?([a-zA-Z]+\.?)/, 'g');
		let matches = [...string.matchAll(regex)];

		if (matches.length) {
			return matches.map(match => {
				return {
					amount: match[1],
					unit: match[2],
					string: match[0],
				};
			});
		} else {
			return string;
		}
	},

	/**
	 * Convert common units/abbreviations to a standardized format
	 * @param  {string} unit
	 * @return {string}
	 */
	formatUnit: function(unit) {

		// remove trailing . (tsp. vs tsp)
		unit = unit.replace('.', '');

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
	convertUnit: function(amount, unit, options = {}) {

		let defaultOptions = {
			format: 'auto',
		};

		// merge in default options
		options = Object.assign({}, defaultOptions, options);

		// todo: do not convert oz unless liquid/dry (volume/weight) is passed in options

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
			if (options.to && volumeMap.hasOwnProperty(options.to)) {
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

		// convert to closest fraction
		if (options.format == 'fraction') {
			newAmount = this.toFraction(newAmount);
		// convert to fraction or decimal
		} else if (options.format == 'auto') {
			newAmount = this.toFraction(newAmount, false);
		}

		return {
			amount: newAmount,
			unit: newUnit,
			string: `${newAmount} ${newUnit}`,
		};
	},

	/**
	 * Convert fraction to decimal
	 * @param  {string}
	 * @return {number}
	 */
	toDecimal: function(fraction) {
		let regex = new RegExp(/(\d+ )?(\d+)(?:\/(\d+))?/);
		let pieces = fraction.match(regex);
		let whole = pieces[1] ? parseInt(pieces[1]) : 0;
		let numerator = pieces[2];
		let denominator = pieces[3];
		return whole + numerator/denominator;
	},

	/**
	 * Convert decimal to fraction
	 * @param  {number}
	 * @param  {boolean}
	 * @return {string}
	 */
	toFraction: function(decimal, findClosest = true) {

		let fraction = '';
		let whole = Math.floor(decimal);

		// already a whole number
		if (whole == decimal) {
			return whole;
		} else {
			decimal = Math.abs(whole - decimal);
		}

		// round to 2 decimal places
		let rounded = decimal.toFixed(2)

		// we could do a bunch of math but realistically 1/8 or 1/16 is the most precise measurement we'll use
		let decimalMap = {
			'0.88': '7/8',
			'0.75': '3/4',
			'0.67': '2/3',
			'0.63': '5/8',
			'0.50': '1/2',
			'0.38': '3/8',
			'0.33': '1/3',
			'0.25': '1/4',
			'0.17': '1/6',
			'0.13': '1/8',
			'0.06': '1/16',
		};

		if (decimalMap.hasOwnProperty(rounded)) {
			// fraction match
			fraction = decimalMap[rounded];
		} else if (findClosest) {
			// find the closest fraction in our map
			let closestDecimal = 1;
			let smallestDelta = 1 - decimal;

			if (decimal <= 0.03) {
				closestDecimal = 0;
			} else {
				Object.keys(decimalMap).forEach(currentDecimal => {
					let delta = Math.abs(parseFloat(currentDecimal) - decimal);
					if (delta <= smallestDelta) {
						smallestDelta = delta;
						closestDecimal = currentDecimal;
					}
				});

				if (closestDecimal == 1) {
					fraction = 0;
					whole++;
				} else {
					fraction = decimalMap[closestDecimal];
				}
			}
		} else {
			// no exact fraction match - just return rounded decimal
			return whole + rounded;
		}

		// combine with whole number
		if (whole && fraction) {
			fraction = `${whole} ${fraction}`;
		} else if (whole) {
			fraction = whole;
		}

		return fraction;
	},

	/**
	 * Multiply an amount and convert to new units
	 * (to get ingredient amounts for half, double, etc. recipe)
	 * @param  {number} amount
	 * @param  {string} unit
	 * @param  {number} multiplier
	 * @param  {object} options
	 * @return {object}
	 */
	multiplyAmount: function(amount, unit, multiplier, options = {}) {

		let defaultOptions = {
			convert: true,
			flags: '',
		};

		// merge in default options
		options = Object.assign({}, defaultOptions, options);

		let convertOptions = {};

		if (typeof amount == 'string') {
			// fraction
			if (amount.indexOf('/') !== -1) {
				amount = this.toDecimal(amount);
				convertOptions.format = 'fraction';
			// decimal
			} else if (amount.indexOf('.') !== -1) {
				amount = parseFloat(amount);
				convertOptions.format = 'decimal';
			} else {
				amount = parseInt(amount);
			}
		}

		if (typeof multiplier == 'string') {
			multiplier = parseFloat(multiplier);
		}

		let newAmount = amount * multiplier;

		if (options.convert) {
			return this.convertUnit(newAmount, unit, convertOptions);
		} else {
			return {
				amount: newAmount,
				unit: unit,
				string: `${newAmout} ${unit}`,
			}
		}
	},

	/**
	 * Replace amounts in a string with multiplied amounts
	 * @param  {string} original
	 * @param  {number} multiplier
	 * @param  {object} options
	 * @return {string} : new string with original amounts replaced with converted amounts
	 */
	multiplyAndReplace: function(original, multiplier, options = {}) {
		let matches = this.parse(original);
		let replaced = original;
		if (typeof matches == 'string') {
			return original;
		} else {
			matches.forEach(match => {
				let multiplied = this.multiplyAmount(match.amount, match.unit, multiplier);
				replaced = original.replace(match.string, multiplied.string);
			});
			return replaced;
		}
	},

}
