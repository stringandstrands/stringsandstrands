require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: products } = await s.from('products').select('*');
  for (const p of products) {
    const name = p.name.toLowerCase();
    
    // Metal
    let metals = [];
    if (name.includes('gold') && !name.includes('rose gold')) metals.push('Gold Plated');
    if (name.includes('rose gold')) metals.push('Rose Gold');
    if (name.includes('silver')) metals.push('Silver');
    if (name.includes('oxidised')) metals.push('Oxidised');
    
    // Type (Earrings only)
    let types = [];
    if (p.category === 'Earrings' || name.includes('earring')) {
      if (name.includes('stud')) types.push('Studs');
      if (name.includes('hoop')) types.push('Hoops');
      if (name.includes('drop') || name.includes('dangler')) types.push('Danglers');
      if (name.includes('jhumka')) types.push('Jhumkas');
      if (types.length === 0) types.push('Studs'); // Default
    } else if (p.category === 'Necklace' || name.includes('necklace')) {
      if (name.includes('choker')) types.push('Chokers');
      if (name.includes('long')) types.push('Long');
    }
    
    // Color
    let colors = [];
    if (name.includes('white')) colors.push('White');
    if (name.includes('pink') || name.includes('rose')) colors.push('Pink');
    if (name.includes('green') || name.includes('jade')) colors.push('Green');
    if (name.includes('blue')) colors.push('Blue');
    if (name.includes('pearl')) colors.push('Pearl');
    if (name.includes('black')) colors.push('Black');
    if (name.includes('red')) colors.push('Red');
    
    // Occasion
    let occ = new Set();
    occ.add('everyday');
    occ.add('gift-for-her');
    if (name.includes('jhumka') || name.includes('kundan') || name.includes('pearl')) {
      occ.add('celebrations');
    }
    if (name.includes('stud') || name.includes('delicate') || name.includes('chain')) {
      occ.add('office');
    }
    
    const update = {
      metal: metals.join(', ') || p.metal,
      type: types.join(', ') || p.type,
      color: colors.join(', ') || p.color,
      occasion: Array.from(occ).join(', ')
    };
    
    await s.from('products').update(update).eq('id', p.id);
  }
  console.log('Successfully tagged ' + products.length + ' products!');
}
run();
