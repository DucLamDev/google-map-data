import { generateAllGrids, generateCityGrid } from '../src/modules/gridGenerator.js';

console.log('=== Grid Generator Test ===\n');

const cities = ['Ho Chi Minh', 'Ha Noi', 'Nha Trang', 'Da Lat'];

console.log('Testing individual city grids:\n');
for (const city of cities) {
  const { coords } = generateCityGrid(city);
  console.log(`${city}: ${coords.length} points`);
  console.log(`  Sample: ${coords.slice(0, 3).join(', ')}\n`);
}

console.log('\nTesting combined grid generation:\n');
const allGrids = generateAllGrids(cities);
console.log(`Total grid points: ${allGrids.length}`);
console.log(`Sample points:`);
allGrids.slice(0, 5).forEach(g => {
  console.log(`  ${g.coord} (${g.city})`);
});

console.log('\n=== Test Complete ===');
