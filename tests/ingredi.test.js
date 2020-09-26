const Ingredi = require('../ingredi');

// parsing text strings to get amounts and units
describe('parsing text', () => {

	let numberFormats = {
		// whole numbers
		'whole numbers': [
			{
				amount: '1',
				unit: 'c',
				string: '1c',
			},
			{
				amount: '12',
				unit: 'c',
				string: '12c',
			},
			{
				amount: '1',
				unit: 'c',
				string: '1 c',
			},
			{
				amount: '12',
				unit: 'c',
				string: '12 c',
			},
		],
		// decimals
		'decimals': [
			{
				amount: '.5',
				unit: 'c',
				string: '.5c',
			},
			{
				amount: '0.5',
				unit: 'c',
				string: '0.5c',
			},
			{
				amount: '1.5',
				unit: 'c',
				string: '1.5c',
			},
			{
				amount: '1.25',
				unit: 'c',
				string: '1.25c',
			},
			{
				amount: '.5',
				unit: 'c',
				string: '.5 c',
			},
			{
				amount: '0.5',
				unit: 'c',
				string: '0.5 c',
			},
			{
				amount: '1.5',
				unit: 'c',
				string: '1.5 c',
			},
			{
				amount: '1.25',
				unit: 'c',
				string: '1.25 c',
			},
		],
		// fractions
		'fractions': [
			{
				amount: '1/2',
				unit: 'c',
				string: '1/2c',
			},
			{
				amount: '3/2',
				unit: 'c',
				string: '3/2c',
			},
			{
				amount: '1/12',
				unit: 'c',
				string: '1/12c',
			},
			{
				amount: '1/2',
				unit: 'c',
				string: '1/2 c',
			},
			{
				amount: '3/2',
				unit: 'c',
				string: '3/2 c',
			},
			{
				amount: '1/12',
				unit: 'c',
				string: '1/12 c',
			},
		],
		// mixed fractions
		'mixed fractions': [
			{
				amount: '1 1/2',
				unit: 'c',
				string: '1 1/2c',
			},
			{
				amount: '1 1/12',
				unit: 'c',
				string: '1 1/12c',
			},
			{
				amount: '12 1/2',
				unit: 'c',
				string: '12 1/2c',
			},
			{
				amount: '12 1/12',
				unit: 'c',
				string: '12 1/12c',
			},
			{
				amount: '1 1/2',
				unit: 'c',
				string: '1 1/2 c',
			},
			{
				amount: '1 1/12',
				unit: 'c',
				string: '1 1/12 c',
			},
			{
				amount: '12 1/2',
				unit: 'c',
				string: '12 1/2 c',
			},
			{
				amount: '12 1/12',
				unit: 'c',
				string: '12 1/12 c',
			},
		],
		// fraction symbols
		'fraction symbols': [
			{
				amount: '1/2',
				unit: 'c',
				string: '½c',
			},
			{
				amount: '1 1/2',
				unit: 'c',
				string: '1½c',
			},
			{
				amount: '1/2',
				unit: 'c',
				string: '½ c',
			},
			{
				amount: '1 1/2',
				unit: 'c',
				string: '1 ½c',
			},
			{
				amount: '1 1/2',
				unit: 'c',
				string: '1 ½ c',
			},
		],
		// ranges
		'ranges': [

			{
				amount: '1-2',
				range: {
					left: {
						amount: '1',
						string: '1',
					},
					right: {
						amount: '2',
						string: '2',
					},
				},
				unit: 'c',
				string: '1-2c',
			},
		],
	};

	// loop through number formats
	Object.entries(numberFormats).forEach(entry => {
		let format = entry[0];
		let values = entry[1];

		values.forEach(val => {
			test(`parse amounts with ${format} like "${val.string}"`, () => {
				expect(Ingredi.parse(val.string)).toMatchObject([val]);
			});
		})
	});

	test('parse unknown units', () => {
		expect(Ingredi.parse('2 potatoes')).toMatchObject(
			[{
				amount: '2',
				unit: 'potatoes',
				string: '2 potatoes',
			}]
		);
	});

	test('parse lines with multiple amounts', () => {
		expect(Ingredi.parse('1 onion (about 2 c diced)')).toMatchObject(
			[
				{
					amount: '1',
					unit: 'onion',
					string: '1 onion',
				},
				{
					amount: '2',
					unit: 'c',
					string: '2 c',
				},
			]
		);
	});

	test('parse multiple lines', () => {
		expect(Ingredi.parse(
			`2 cups (9 oz) flour
			1 tsp salt
			2/3 cup butter/shortening`)).toMatchObject(
			[
				{
					amount: '2',
					unit: 'cups',
					string: '2 cups',
				},
				{
					amount: '9',
					unit: 'oz',
					string: '9 oz',
				},
				{
					amount: '1',
					unit: 'tsp',
					string: '1 tsp',
				},
				{
					amount: '2/3',
					unit: 'cup',
					string: '2/3 cup',
				},
			]
		);
	});
});

// formatting units into a single standardized format
describe('formatting units', () => {

	test('format tsp', () => {
		['t', 'tsp', 'teaspoon', 'teaspoons'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('tsp');
		});
	});

	test('format tbsp', () => {
		['T', 'tbl', 'tbs', 'TBSP', 'tablespoon', 'tablespoons'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('tbsp');
		});
	});

	test('format oz', () => {
		['oz', 'ounce', 'ounces', 'floz', 'fl oz', 'fluid oz', 'fluid ounce', 'fluid ounces'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('oz');
		});
	});

	test('format c', () => {
		['c', 'cup', 'cups'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('c');
		});
	});

	test('format pt', () => {
		['pt', 'pint', 'pints'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('pt');
		});
	});

	test('format qt', () => {
		['qt', 'quart', 'quarts'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('qt');
		});
	});

	test('format gal', () => {
		['gal', 'gallon', 'gallons'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('gal');
		});
	});

	test('format lb', () => {
		['LB', 'lbs', 'pound', 'pounds'].forEach(unit => {
			expect(Ingredi.formatUnit(unit)).toBe('lb');
		});
	});

});

// multiplying ranges
describe('multiplying ranges', () => {

	test('multiply ranges by a whole number', () => {
		expect(Ingredi.multiplyAndReplace('1-2 c', 2)).toBe('2-4 c');
	});

	test('multiply ranges by a fraction', () => {
		expect(Ingredi.multiplyAndReplace('2-4c', 1/2)).toBe('1-2 c');
		expect(Ingredi.multiplyAndReplace('1-2c', 1/2)).toBe('1/2-1 c');
		expect(Ingredi.multiplyAndReplace('1.5-3c', 1/3)).toBe('0.5-1 c');
	});

	test('multiply ranges by a decimal', () => {
		expect(Ingredi.multiplyAndReplace('2-4c', .5)).toBe('1-2 c');
		expect(Ingredi.multiplyAndReplace('1 to 2 cups', 0.5)).toBe('1/2 to 1 c');
		expect(Ingredi.multiplyAndReplace('1 - 2 c', 1.5)).toBe('1 1/2 - 3 c');
	});

	test('multiply ranges and convert each side to different units', () => {
		expect(Ingredi.multiplyAndReplace('1 - 3 tbsp', 1/3)).toBe('1 tsp - 1 tbsp');
	});
});
