const Ingredi = require('../ingredi');

test('parse amounts with fractions', () => {
	expect(Ingredi.parse('1/2 c sugar')).toMatchObject(
		[{
			amount: '1/2',
			unit: 'c',
			string: '1/2 c',
		}]
	);
});

test('parse amounts with mixed fractions and whole numbers', () => {
	expect(Ingredi.parse('1 1/2 c flour')).toMatchObject(
		[{
			amount: '1 1/2',
			unit: 'c',
			string: '1 1/2 c',
		}]
	);
});

test('parse amounts with decimals', () => {
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
