/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieceType, TrapType, ItemType } from '../types/game';

export interface CharacterQuote {
  speaker: string;
  avatar: string;
  text: string;
  soundCue?: string;
  comicTag?: 'BAM!' | 'POW!' | 'WHAM!' | 'OOPS!' | 'ZAP!' | 'BOING!' | 'K.O.!';
}

const KING_MOVE_QUOTES = [
  'Kliďte se z cesty, Jeho Výsost kráčí!',
  'Moje koruna je těžká, ale moje ego ještě těžší!',
  'Kde mám své pečené kuře?!',
  'Jeden krok pro krále, obří skok pro království!',
  'Dneska jsem obzvlášť majestátní, že ano?',
];

const KING_CHECK_QUOTES = [
  'POMÓC! Velezrada! Kde jsou moje stráže?!',
  'Né na obličej, jsem přece král!',
  'Rychle, přiveďte mi ochutnavače!',
  'Kdo vám dovolil na mě takhle útočit?!',
];

const QUEEN_MOVE_QUOTES = [
  'Cesta pro královnu dramatu!',
  'Můj styl je smrtící a boty drahé!',
  'Dívej se a uč se, brouku!',
  'Šachovnice je moje módní molo!',
];

const QUEEN_CAPTURE_QUOTES = [
  'Promiň zlato, tenhle outfit ti vůbec neslušel!',
  'BUM! Jsi vyškrtnut ze seznamu hostů!',
  'Moc pomalý! Příště si vezmi tenisky!',
];

const KNIGHT_MOVE_QUOTES = [
  'Iháhá! Parkour mistr na scéně!',
  'Skáču do písmene L, protože jsem Legenda!',
  'Kopyta namazána, letííím!',
  'Kdo potřebuje rovný cesty, když má pružiny?!',
];

const BISHOP_MOVE_QUOTES = [
  'Abraka-dabra a jsi bez figury!',
  'Hvězdy říkaly, že diagonála je dnes bezpečná!',
  'Můj plnovous má vlastní gravitační pole!',
  'Čaruji, kouzlím... a šup tam!',
];

const ROOK_MOVE_QUOTES = [
  'DUDUDUM! Těžká váha v pohybu!',
  'Uhněte, nebo vás zašlápnu do dlažby!',
  'Kamení má absolutní přednost v jízdě!',
  'Jsem pevnost na kolečkách, brácho!',
];

const ROOK_CAPTURE_QUOTES = [
  'DRTIČ 3000 v akci! K.O.!',
  'Placička hotová!',
  'BUM! A je z tebe palačinka!',
];

const PAWN_MOVE_QUOTES = [
  'Táp-táp-táp, už běžím, šéfe!',
  'Jednou ze mě bude královna, uvidíte!',
  'Jsem malej, ale hrozně zákeřnej!',
  'Krok za krokem k věčné slávě!',
];

const TRAP_QUOTES: Record<TrapType, string[]> = {
  banana: [
    'Jééé, skluzavkaaa! Pomóóóc!',
    'Kdo nechal tu slupku na mém koberci?!',
    '360 stupňová pirueta zdarma!',
    'Moje záda! To bolí!',
  ],
  spring: [
    'BOINGGG! Letím do oblak!',
    'Gravitace je dneska nějaká rozbitá!',
    'Houston, máme skákací problém!',
  ],
  teleport: [
    'Časoprostorový zmatek! Kde to sakra jsem?!',
    'Moje oblíbená zkratka druhou dimenzí!',
    'Tady jsem nechtěl! Chci reklamaci!',
  ],
  freeze: [
    'Brrr! Kdo tady zapomněl zavřít mrazák?!',
    'Jsem rampouch! Ani hnout!',
    'Potřebuju horkej čaj, okamžitě!',
  ],
  swap: [
    'Cože?! V cizím těle a na cizím poli?!',
    'Kouzlo zmatku! Čau na druhé straně!',
  ],
  confetti_pop: [
    'Oslavná rána! Jsem nezničitelný!',
    'Párty začíná! Dejte mi štít!',
  ],
};

const ITEM_QUOTES: Record<ItemType, string[]> = {
  rocket_boots: [
    'Raketový pohon zažehnut! Přelétám všechny!',
    'Rychle a zběsile na šachovnici!',
  ],
  mega_hammer: [
    'S tímhle obřím kladivem nikdo neprojde!',
    'Čas na velkej kreslenej BONK!',
  ],
  bubble_shield: [
    'Bublina aktivována! Ani škrábanec!',
    'Bouncy bouncy štít pro mé bezpečí!',
  ],
  magic_mirror: [
    'Kdo je na šachovnici nejkrásnější? Já!',
  ],
  speed_potion: [
    'Turbo energie! Dvojitý tah!',
  ],
};

export function getRandomQuote(
  type: PieceType,
  event: 'move' | 'capture' | 'captured' | 'check' | 'trap' | 'item',
  extraInfo?: { trapType?: TrapType; itemType?: ItemType }
): CharacterQuote {
  const speakerNames: Record<PieceType, string> = {
    king: 'Král Všeználek',
    queen: 'Královna Divoká',
    knight: 'Oř Skokan',
    bishop: 'Mág Vousáč',
    rook: 'Golem Drtič',
    pawn: 'Skřet Minion',
  };

  const speakerAvatars: Record<PieceType, string> = {
    king: '👑',
    queen: '👸',
    knight: '🦄',
    bishop: '🧙‍♂️',
    rook: '🗿',
    pawn: '👺',
  };

  let pool: string[] = [];
  let tag: CharacterQuote['comicTag'] = 'POW!';

  if (event === 'check' && type === 'king') {
    pool = KING_CHECK_QUOTES;
    tag = 'OOPS!';
  } else if (event === 'trap' && extraInfo?.trapType) {
    pool = TRAP_QUOTES[extraInfo.trapType] || ['Ajajaj!'];
    tag = extraInfo.trapType === 'banana' ? 'OOPS!' : extraInfo.trapType === 'spring' ? 'BOING!' : 'ZAP!';
  } else if (event === 'item' && extraInfo?.itemType) {
    pool = ITEM_QUOTES[extraInfo.itemType] || ['Bonus je můj!'];
    tag = 'BAM!';
  } else if (event === 'capture') {
    if (type === 'queen') pool = QUEEN_CAPTURE_QUOTES;
    else if (type === 'rook') pool = ROOK_CAPTURE_QUOTES;
    else pool = ['BUM! A máš to spočítané!', 'K.O.! Přímý zásah!'];
    tag = 'WHAM!';
  } else {
    // Normal move
    switch (type) {
      case 'king': pool = KING_MOVE_QUOTES; break;
      case 'queen': pool = QUEEN_MOVE_QUOTES; break;
      case 'knight': pool = KNIGHT_MOVE_QUOTES; break;
      case 'bishop': pool = BISHOP_MOVE_QUOTES; break;
      case 'rook': pool = ROOK_MOVE_QUOTES; break;
      case 'pawn': pool = PAWN_MOVE_QUOTES; break;
    }
    tag = 'POW!';
  }

  const text = pool[Math.floor(Math.random() * pool.length)];

  return {
    speaker: speakerNames[type],
    avatar: speakerAvatars[type],
    text,
    comicTag: tag,
  };
}
