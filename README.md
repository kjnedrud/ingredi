# Ingredi

Super simple ingredient parsing and conversion in JavaScript

## Example Usage

**Doubling a recipe?**

```Ingredi.multiplyAmount('1 small or 1/2 large onion, chopped (about 1 cup)', 2);```

Result: `2 small or 1 large onion, chopped (about 2 c)`

**Making a pitcher instead of a glass?**

```Ingredi.multiplyAmount('2 oz gin', 12)```

Result: `3 c gin`

**Just need to convert units?**

```Ingredi.convertUnit(3/4, 'cup', {to: 'tbsp'})```

Result: `{amount: 12, unit: "tbsp", string: "12 tbsp"}`

## Tests

1. Install dependencies: `yarn install`
2. Run tests: `yarn test`

## Coming Soon
* better documentation
* dry ingredient conversion from volume to weight for baking
