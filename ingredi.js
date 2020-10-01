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
		// note: double backslashes are required in pattern strings so they will be treated as literal backslashes when combining to build the regex

		// fraction: 1/2, ½, 1 1/2, 1½, 1 ½
		let fractionPattern = `(?:\\d+ )?\\d+\\/\\d+|(?:\\d+ ?)?[½⅓¼⅛⅔¾]`;

		// decimal: .5, 0.5, 1.5
		let decimalPattern = `\\d*\\.\\d+`;

		// whole number, fraction, or decimal
		let numberPattern = `\\d+|${fractionPattern}|${decimalPattern}`;

		// range: 1/2-1, 1 1/2 - 2, 1½-2, 1½ - 2, .5-1, 1 to 2
		let rangePattern = `(${numberPattern})(-| - | to )(${numberPattern})`;

		// combine pattern strings into one big gnarly regex
		let regex = new RegExp(`(${rangePattern}|${numberPattern}) ?([a-zA-Z]+\\.?)`, 'g');

		let matches = [...string.matchAll(regex)];

		if (matches.length) {

			return matches.map(match => {
				let parsed = {
					amount: this.convertFractionSymbols(match[1]),
					unit: match[5],
					string: match[0],
				};

				// check for range
				if (match[2] && match[3] && match[4]) {
					parsed.range = {
						left: {
							amount: this.convertFractionSymbols(match[2]),
							string: match[2],
						},
						sep: match[3],
						right: {
							amount: this.convertFractionSymbols(match[4]),
							string: match[4],
						},
					};
				}

				return parsed;
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
			case 'lb':
			case 'lbs':
			case 'pound':
			case 'pounds':
				return 'lb';
			case 'stick':
			case 'sticks':
				return 'stick';
			// todo: metric units
			default:
				return unit;
		}
	},

	/**
	 * Get map of all units and equivalent values that a that given unit can be converted to
	 * @param  {String} unit
	 * @param  {Object} options
	 * @return {Object}
	 */
	getUnitMap: function(unit, options = {}) {
		let defaultOptions = {
			format: 'auto',
			flags: '',
		};
		let unitMap = {};

		// merge in default options
		options = Object.assign({}, defaultOptions, options);

		// first standardize unit format
		unit = this.formatUnit(unit);

		if (options.type == 'weight') {
			// weight conversion map
			// todo: add grams?
			unitMap = {
				'oz': 16,
				'lb': 1,
			};
		// convert between volume and weight
		} else if (((unit == 'oz' && options.to == 'c') || (unit == 'c' && options.to == 'oz')) && options.flags.includes('flour')) {
			// volume to weight conversion map for flour
			if (options.flags.includes('rye')) {
				// 3.5 oz to 1 cup flour (rye)
				unitMap = {
					'c': 1,
					'oz': 3.5,
				};
			} else {
				// 4.5 oz to 1 cup flour (all purpose or wheat)
				unitMap = {
					'c': 1,
					'oz': 4.5,
				};
			}
		} else if (options.flags.includes('butter')) {
			// butter conversion map
			unitMap = {
				'tbsp': 8,
				'c': 1/2,
				'stick': 1,
				'oz': 4,
				'lb': 1/4,
			};
		} else {
			// volume conversion map
			unitMap = {
				'tsp': 16 * 3, // 3 tsp = 1 tbsp
				'tbsp': 16,
				'oz': 16 / 2, // 1/2 fl oz = 1 tbsp
				'c': 1,
				'pt': 1/2,
				'qt': 1/4,
				'gal': 1/16,
			};
		}

		return unitMap;
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

		let newAmount, newUnit;
		let defaultOptions = {
			format: 'auto',
			flags: '',
		};

		// merge in default options
		options = Object.assign({}, defaultOptions, options);

		// first standardize unit format
		unit = this.formatUnit(unit);

		// if converting to/from lbs, this is a weight conversion
		if (unit == 'lb' || options.to == 'lb') {
			options.type = 'weight';
		}

		// if oz and unsure if weight or volume, do not convert
		if (unit == 'oz' && (!options.type || !options.flags.includes('liquor'))) {
			console.log('Warning: cannot convert ambiguous oz (unclear if volume or weight)');
			newAmount = amount;
			newUnit = unit;
		} else {
			// get unit map
			let unitMap = this.getUnitMap(unit, options);

			// if unit to convert to was passed in options, use that
			if (options.to) {
				newUnit = options.to;
			// attempt to automatically choose the unit that makes most sense based on amount
			} else if (unitMap.hasOwnProperty('c')) {
				// volume
				let amountInCups = unitMap['c'] * amount / unitMap[unit];

				// default: c
				newUnit = 'c';

				// if >= 8 c (2 qt), use qt
				if (amountInCups >= 8) {
					newUnit = 'qt';
				// if < 1 tbsp (3 tsp), use tsp
				} else if (amountInCups < 1/16) {
					newUnit = 'tsp';
				// if <= 1/2 c (4 oz), use oz for liquor
				} else if (amountInCups <= 1/2 && options.flags.includes('liquor')) {
					newUnit = 'oz';
				// butter units
				} else if (options.flags.includes('butter')) {
					// if < 1/2 c (1 stick), use tbsp
					if (amountInCups < 1/2) {
						newUnit = 'tbsp';
					} else {
						newUnit = 'stick';
					}
					// todo: smarter butter conversion - use 1/2 stick increments, or formats like 1 stick + 2 tbsp
				// if < 1/4 c (4 tbsp), use tbsp
				} else if (amountInCups < 1/4) {
					newUnit = 'tbsp';
				}
			} else if (unitMap.hasOwnProperty('lb')) {
				// weight
				let amountInOz = unitMap['oz'] * amount / unitMap[unit];

				// if <= 16 oz (1 lb), use lb
				if (amountInOz >= 16) {
					newUnit = 'lb';
				} else {
					newUnit = 'oz';
				}
			}

			// if both units are in the unit map, calculate the conversion factor and convert to new unit
			if (unitMap.hasOwnProperty(unit) && unitMap.hasOwnProperty(newUnit)) {
				let conversionFactor = unitMap[newUnit] / unitMap[unit];
				newAmount = amount * conversionFactor;
			// if unit is not in our map, do not convert
			} else {
				console.log(`Error: cannot convert ${unit} to ${newUnit} (incompatible units)`);
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
	 * Replace all the fraction symbols in a string with numeric equivalent values
	 * @param  {String} text
	 * @return {String}
	 */
	convertFractionSymbols: function(text) {
		let fractionMap = {
			'½' : '1/2',
			'⅓' : '1/3',
			'¼' : '1/4',
			'⅛' : '1/8',
			'⅔' : '2/3',
			'¾' : '3/4',
		};

		let fractionSymbols = Object.keys(fractionMap);
		let fractionSymbolRegex = new RegExp(` ?[${fractionSymbols.join('')}]`, 'g');

		// replace fraction symbols with their mapped values
		text = text.replace(fractionSymbolRegex, (match) => {
			// make sure there is a leading space so "1½" becomes "1 1/2" instead of "11/2"
			return ' ' + fractionMap[match.trim()];
		});

		// trim any extra leading space if there was nothing before it
		return text.trim();
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

		let convertOptions = {
			flags: options.flags,
		};

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
	 * @param  {string} text
	 * @param  {number} multiplier
	 * @param  {object} options
	 * @return {string} : new string with original amounts replaced with converted amounts
	 */
	multiplyAndReplace: function(text, multiplier, options = {}) {
		let matches = this.parse(text);
		if (typeof matches == 'string') {
			return text;
		} else {
			matches.forEach(match => {

				if (match.range) {
					// if amount is a range, multiply left and right sides separately
					let multipliedLeft = this.multiplyAmount(match.range.left.amount, match.unit, multiplier, options);
					let multipliedRight = this.multiplyAmount(match.range.right.amount, match.unit, multiplier, options);

					if (multipliedLeft.unit == multipliedRight.unit) {
						// if both sides are the same unit, only include unit on right side
						text = text.replace(match.string, `${multipliedLeft.amount}${match.range.sep}${multipliedRight.string}`)

					} else {
						// if units are different, must include on both sides
						text = text.replace(match.string, `${multipliedLeft.string}${match.range.sep}${multipliedRight.string}`)
					}

				} else if (match.amount) {
					let multiplied = this.multiplyAmount(match.amount, match.unit, multiplier, options);
					text = text.replace(match.string, multiplied.string);
				}
			});
			return text;
		}
	},

}

module.exports = Ingredi;
