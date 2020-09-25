const Ingredi = require('../ingredi');

// parsing text strings to get amounts and units
describe('parsing text', () => {

	test('parse amounts with fractions like "1/2"', () => {
		expect(Ingredi.parse('1/2 c sugar')).toMatchObject(
			[{
				amount: '1/2',
				unit: 'c',
				string: '1/2 c',
			}]
		);
	});

	test('parse amounts with mixed fractions and whole numbers like "1 1/2"', () => {
		expect(Ingredi.parse('1 1/2 c flour')).toMatchObject(
			[{
				amount: '1 1/2',
				unit: 'c',
				string: '1 1/2 c',
			}]
		);
	});

	test('parse amounts with decimals like "1.5"', () => {
		expect(Ingredi.parse('1.5 c sugar')).toMatchObject(
			[{
				amount: '1.5',
				unit: 'c',
				string: '1.5 c',
			}]
		);
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

