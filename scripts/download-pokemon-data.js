// Download all Pokémon sprites and data from PokéAPI
// Run with: node scripts/download-pokemon-data.js

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TOTAL_POKEMON = 1025;
const SPRITES_DIR = path.join(__dirname, '../public/pokemon/sprites');
const DATA_FILE = path.join(__dirname, '../public/pokemon/data.json');

// Katakana to Romaji mapping
const KATAKANA_MAP = {
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  'ヴァ': 'va', 'ヴィ': 'vi', 'ヴ': 'vu', 'ヴェ': 've', 'ヴォ': 'vo',
  'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
  'ティ': 'ti', 'ディ': 'di', 'トゥ': 'tu', 'ドゥ': 'du',
  'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
  'シェ': 'she', 'ジェ': 'je', 'チェ': 'che',
  'ツァ': 'tsa', 'ツィ': 'tsi', 'ツェ': 'tse', 'ツォ': 'tso',
  'ファ': 'fa', 'フュ': 'fyu',
  'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
  'ャ': 'ya', 'ュ': 'yu', 'ョ': 'yo',
  'ッ': 'tsu', 'ー': '-',
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
};

const KATAKANA_KEYS = Object.keys(KATAKANA_MAP).sort((a, b) => b.length - a.length);

function breakdownKana(kana) {
  const chars = [];
  const romaji = [];
  let i = 0;
  
  while (i < kana.length) {
    let matched = false;
    for (const key of KATAKANA_KEYS) {
      if (kana.startsWith(key, i)) {
        chars.push(key);
        romaji.push(KATAKANA_MAP[key]);
        i += key.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      chars.push(kana[i]);
      romaji.push(kana[i]);
      i++;
    }
  }
  return { chars, romaji };
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'PokemonKanaSpeller/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    client.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(' pokemon Kana Speller - Asset Downloader');
  console.log('='.repeat(50));
  console.log(`Downloading data for ${TOTAL_POKEMON} Pokemon...\n`);
  
  // Ensure directories exist
  if (!fs.existsSync(SPRITES_DIR)) {
    fs.mkdirSync(SPRITES_DIR, { recursive: true });
  }
  
  const pokemon = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let id = 1; id <= TOTAL_POKEMON; id++) {
    try {
      // Fetch Pokemon data
      const pokemonData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${id}`);
      
      // Fetch species data for Japanese name
      const speciesData = await fetchJSON(pokemonData.species.url);
      
      // Find Japanese name
      const japaneseName = speciesData.names.find(n => n.language.name === 'ja')?.name;
      if (!japaneseName) {
        console.log(`  [SKIP] #${id} - No Japanese name`);
        failCount++;
        continue;
      }
      
      // Format English name
      let englishName = pokemonData.name;
      englishName = englishName.charAt(0).toUpperCase() + englishName.slice(1);
      
      // Break down katakana
      const { chars, romaji } = breakdownKana(japaneseName);
      
      // Download sprite
      const spriteUrl = pokemonData.sprites.front_default || 
                       `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
      const spritePath = path.join(SPRITES_DIR, `${id}.png`);
      
      if (!fs.existsSync(spritePath)) {
        await downloadFile(spriteUrl, spritePath);
      }
      
      pokemon.push({
        id,
        name: englishName,
        japanese: japaneseName,
        romaji: romaji.join('').replace(/-/g, ''),
        kana: chars,
        romajiParts: romaji.map(r => r.replace(/-/g, '')),
        sprite: `/pokemon/sprites/${id}.png`
      });
      
      successCount++;
      process.stdout.write(`\r  [${successCount}/${TOTAL_POKEMON}] #${id} ${englishName} = ${japaneseName}     `);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 50));
      
    } catch (e) {
      console.log(`\n  [FAIL] #${id} - ${e.message}`);
      failCount++;
    }
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log(`Download complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total: ${pokemon.length}`);
  
  // Save data
  fs.writeFileSync(DATA_FILE, JSON.stringify(pokemon, null, 2));
  console.log(`\nData saved to: ${DATA_FILE}`);
  console.log(`Sprites saved to: ${SPRITES_DIR}`);
  
  // Show file sizes
  const dataStats = fs.statSync(DATA_FILE);
  console.log(`\nData file size: ${(dataStats.size / 1024).toFixed(1)} KB`);
  
  // Count sprites
  const spriteFiles = fs.readdirSync(SPRITES_DIR).filter(f => f.endsWith('.png'));
  console.log(`Sprite files: ${spriteFiles.length}`);
}

main().catch(console.error);
