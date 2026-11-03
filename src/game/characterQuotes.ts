/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieceType, TrapType, ItemType, PieceColor } from '../types/game';

export interface CharacterQuote {
  speaker: string;
  avatar: string;
  text: string;
  pieceType?: PieceType;
  color?: PieceColor;
  soundCue?: string;
  comicTag?: 'BAM!' | 'POW!' | 'WHAM!' | 'OOPS!' | 'ZAP!' | 'BOING!' | 'K.O.!' | 'CRACK!' | 'WOW!' | 'BRR!' | 'BOOM!' | 'SMACK!';
}

export type QuoteEvent =
  | 'move'
  | 'capture'
  | 'captured'
  | 'check'
  | 'trap'
  | 'item'
  | 'select'
  | 'promotion'
  | 'shield_block'
  | 'shield_bounce'
  | 'mirror_reflect'
  | 'hammer_smash'
  | 'rocket_jump'
  | 'extra_turn'
  | 'frozen'
  | 'victory'
  | 'defeat'
  | 'lightning_strike'
  | 'magnet_pull'
  | 'tnt_blast'
  | 'glue_stuck'
  | 'special';

type Pool = Record<PieceType, string[]>;

const MOVE: Pool = {
  king: [
    'Kliďte se z cesty, Jeho Výsost kráčí!',
    'Moje koruna je těžká, ale moje ego ještě těžší.',
    'Kde mám své pečené kuře?!',
    'Jeden krok pro krále, obří skok pro království!',
    'Pomalu, opatrně… králové neběhají.',
    'Tohle je královská procházka, žádný úprk!',
    'Kdo mi zase schoval žezlo?',
  ],
  queen: [
    'Uvolněte molo, přichází královna!',
    'Můj styl je smrtící a boty drahé.',
    'Dívej se a uč se, broučku.',
    'Diagonála, rovinka… mně je to jedno, zlato.',
    'Jdu tam, kam se mi zachce. Jsem přece dáma!',
    'Ten účes mi drží líp než tvoje obrana.',
  ],
  knight: [
    'Íhahá! Parkour mistr je na scéně!',
    'Skáču do písmene L, protože jsem Legenda!',
    'Kopyta namazaná, letííím!',
    'Kdo potřebuje rovné cesty, když má pružiny?',
    'Hop sem, hop tam, nikdo mě nechytí!',
    'Pozor, koník bez brzd!',
  ],
  bishop: [
    'Abraka-dabra, šikmo napravo!',
    'Hvězdy praví, že diagonála je dnes bezpečná.',
    'Můj plnovous má vlastní gravitační pole.',
    'Čaruji, kouzlím… a šup tam!',
    'Rovně chodí jen amatéři.',
    'Hokus pokus, nový fokus!',
  ],
  rook: [
    'DUDUDUM! Těžká váha v pohybu!',
    'Uhněte, nebo vás zašlápnu do dlažby!',
    'Kamení má absolutní přednost v jízdě.',
    'Jsem pevnost na kolečkách, brácho!',
    'Rovně a bez zatáček, tak to mám rád.',
    'Pozor, tady se drtí dlažba!',
  ],
  pawn: [
    'Táp-táp-táp, už běžím, šéfe!',
    'Jednou ze mě bude královna, uvidíte!',
    'Jsem malej, ale hrozně zákeřnej!',
    'Krok za krokem k věčné slávě!',
    'Hlavně nešlápnout na banán…',
    'Kupředu, levá, kupředu, pravá!',
    'Já jsem jen pěšák, já nic nevím!',
  ],
};

const SELECT: Pool = {
  king: ['Ano? Král poslouchá.', 'Doufám, že je to důležité!', 'Kam mě to zase táhneš?'],
  queen: ['Konečně si mě někdo všiml!', 'Mluv rychle, zlato.', 'Jsem připravená zářit!'],
  knight: ['Íhahá, kam to bude?', 'Konečně akce!', 'Kopyta už se mi třesou!'],
  bishop: ['Hvězdy mě volají…', 'Ano, můj pane?', 'Mám v rukávu pár kouzel.'],
  rook: ['HRRM. Golem připraven.', 'Kdo mě budí?', 'Drtič čeká na rozkaz.'],
  pawn: ['Já?! Opravdu já?', 'Hlásím se do služby!', 'Ano, šéfe! Hned, šéfe!'],
};

const CAPTURE: Pool = {
  king: ['Ani král se nebojí ušpinit rukavice!', 'Za vlast a za kuře!', 'Královská facka!'],
  queen: [
    'Promiň zlato, tenhle outfit ti vůbec neslušel!',
    'BUM! Jsi vyškrtnutý ze seznamu hostů!',
    'Moc pomalý! Příště si vezmi tenisky!',
    'Šach-šmach, a jsi pryč.',
  ],
  knight: ['Kopytem do zadku, letíš!', 'Íhahá, strike!', 'Překvapení zezadu!'],
  bishop: ['Puf! Zmizel jsi jako králík z klobouku!', 'Kouzlo vyhazovací, první stupeň!', 'Abrakadabra, jsi pryč!'],
  rook: ['DRTIČ 3000 v akci! K.O.!', 'Placička hotová!', 'BUM! A je z tebe palačinka!'],
  pawn: ['Malej, ale šikovnej!', 'Ha! Pěšák tě dostal!', 'Tohle si dej do životopisu!'],
};

const CAPTURED: Pool = {
  king: ['To je velezrada!'],
  queen: ['Moje vlasy! Moje šaty!', 'To si ještě vyřídíme!', 'Tohle nebylo fér, zlato!'],
  knight: ['Íhaaaaa… letím do stáje!', 'Moje kopyta!'],
  bishop: ['Tohle jsem v křišťálové kouli neviděl!', 'Moje kouzla selhala!'],
  rook: ['Rozpadám se na kamínky!', 'Zavolejte zedníka!'],
  pawn: ['Áááá! Mamíííí!', 'Já jsem věděl, že to tak dopadne!', 'Aspoň jsem to zkusil!'],
};

const CHECK = [
  'POMÓC! Velezrada! Kde jsou moje stráže?!',
  'Né na obličej, jsem přece král!',
  'Rychle, přiveďte mi ochutnávače!',
  'Kdo vám dovolil na mě takhle útočit?!',
  'Šach?! To si dělá legraci!',
  'Stráže! STRÁŽE!',
];

const PROMOTION = [
  'Kdo se směje naposled, ten je královna!',
  'Říkal jsem to! Já jsem to říkal!',
  'Mami, podívej, mám korunu!',
  'Z pěšáka až na trůn, to je kariéra!',
];

const TRAP_QUOTES: Record<TrapType, string[]> = {
  banana: [
    'Jééé, klouzačkaaa! Pomóóóc!',
    'Kdo nechal tu slupku na mém koberci?!',
    'Pirueta za tři sta šedesát stupňů zdarma!',
    'Moje záda! To bolí!',
  ],
  spring: ['BOINGGG! Letím do oblak!', 'Gravitace je dneska nějaká rozbitá!', 'Houstone, máme skákací problém!'],
  teleport: [
    'Časoprostorový zmatek! Kde to sakra jsem?!',
    'Moje oblíbená zkratka druhou dimenzí!',
    'Tady jsem nechtěl být! Chci reklamaci!',
  ],
  freeze: ['Brrr! Kdo tady nechal otevřenej mrazák?!', 'Jsem rampouch! Ani hnout!', 'Potřebuju horkej čaj, okamžitě!'],
  swap: ['Cože?! Na cizím poli?!', 'Kouzlo zmatku! Čau na druhé straně!', 'Kde to jsem? A kdo jsi ty?!'],
  confetti_pop: ['Párty! Jsem nezničitelný!', 'Konfety a štít? To je den!', 'Oslavná rána!'],
  tnt: ['KABOOM! Všude lítá kouř!', 'Moje uši! Kdo to sem dal?!', 'Tlaková vlna level tisíc!'],
  glue: ['Fuuuj, lepkavej zelenáč!', 'Nemůžu odlepit nohu z dlažby!', 'Tohle nevypere ani babička!'],
};

const ITEM_QUOTES: Record<ItemType, string[]> = {
  rocket_boots: ['Raketové trysky nahozeny! Přeletím všechny!', 'Rychle a zběsile na šachovnici!', 'Tři, dva, jedna… start!'],
  mega_hammer: ['S tímhle obřím kladivem nikdo neprojde!', 'Čas na velkej kreslenej BONK!', 'Kladivo v ruce, problém na obzoru!'],
  bubble_shield: ['Bublina aktivována! Ani škrábanec!', 'Jsem v bublině a je mi tu dobře!', 'Zkus to, jestli si troufneš!'],
  magic_mirror: ['Zrcadlo, zrcadlo… kdo je tu nejkrásnější? Já!', 'Kdo na mě zaútočí, ten uvidí!', 'Odrazím všechno!'],
  speed_potion: ['Turbo energie! Hraju znovu!', 'Glo-glo-glo… JDEME NA TO!', 'Cítím se rychlejší než blesk!'],
  lightning_rod: ['Nabito bleskem! Teď střílím skrz celou šachovnici!', 'Cítím miliony voltů! Uhněte!', 'Blesková show začíná!'],
  magnet: ['Super magnet sepnut! Všechny bonusy ke mně!', 'Pojďte ke mně, dárečky!', 'Magnetická síla v plném proudu!'],
};

const EFFECT_QUOTES: Record<
  | 'shield_block'
  | 'mirror_reflect'
  | 'hammer_smash'
  | 'rocket_jump'
  | 'extra_turn'
  | 'frozen'
  | 'lightning_strike'
  | 'magnet_pull'
  | 'tnt_blast'
  | 'glue_stuck',
  string[]
> = {
  shield_block: ['Ha! Odrazil ses od mé bubliny!', 'Bublina drží! Zkus to znovu!', 'Boing! Tudy ne, kamaráde!'],
  mirror_reflect: ['Zrcadlo vrátilo úder! Sbohem!', 'Útok se ti vymstil!', 'Podívej se do zrcadla… a zmiz!'],
  hammer_smash: ['BONK! Všichni kolem mají hvězdičky!', 'Kladivo mluví za mě!', 'Zemětřesení v přímém přenosu!'],
  rocket_jump: ['Přeletěl jsem vás všechny!', 'Šššššš… přistání!', 'Vzdušná linka má zpoždění nula minut!'],
  extra_turn: ['Ještě jednou! Ještě jednou!', 'Lektvar zabral, jedeme dál!', 'Jsem tak rychlý, že hraju dvakrát!'],
  frozen: ['Nemůžu se hnout… brrr.', 'Ještě chvilku, jsem zmrzlý!', 'Rozmrazte mě někdo!'],
  lightning_strike: ['BZZZZT! Bleskový zásah přes půl království!', 'Elektřina vyřešila všechno!', 'Paprsek přesně do černého!'],
  magnet_pull: ['Cvak! Všechno je na svém místě!', 'Magnetická přitažlivost funguje skvěle!', 'Bonus přímo do kapsy!'],
  tnt_blast: ['BUM! To byla rána z děla!', 'Výbuch smetl všechno okolo!', 'Dynamit nikdy nezklame!'],
  glue_stuck: ['Mlask, plác… táhnu se jak těsto.', 'Ten sliz drží líp než žvýkačka!', 'Krok za krokem, pomalu.'],
};

const SPEAKER_NAMES: Record<PieceType, string> = {
  king: 'Král Bručoun',
  queen: 'Královna Diva',
  knight: 'Koník Skokan',
  bishop: 'Mág Vousáč',
  rook: 'Golem Drtič',
  pawn: 'Pěšák Pepík',
};

const SPEAKER_AVATARS: Record<PieceType, string> = {
  king: '🤴',
  queen: '👸',
  knight: '🦄',
  bishop: '🧙‍♂️',
  rook: '🗿',
  pawn: '💂',
};

const lastByPool = new Map<string[], string>();

function pick(pool: string[]): string {
  if (pool.length === 0) return 'Hmm!';
  if (pool.length === 1) return pool[0];
  const last = lastByPool.get(pool);
  let choice = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while (choice === last && guard++ < 5) {
    choice = pool[Math.floor(Math.random() * pool.length)];
  }
  lastByPool.set(pool, choice);
  return choice;
}

export function getSpeakerName(type: PieceType): string {
  return SPEAKER_NAMES[type];
}

export function getRandomQuote(
  type: PieceType,
  event: QuoteEvent,
  extraInfo?: { trapType?: TrapType; itemType?: ItemType; color?: PieceColor }
): CharacterQuote {
  let pool: string[] = [];
  let tag: CharacterQuote['comicTag'] = 'POW!';
  let speakerType: PieceType = type;

  switch (event) {
    case 'check':
      speakerType = 'king';
      pool = CHECK;
      tag = 'OOPS!';
      break;
    case 'trap':
      pool = (extraInfo?.trapType && TRAP_QUOTES[extraInfo.trapType]) || ['Ajajaj!'];
      tag =
        extraInfo?.trapType === 'banana'
          ? 'OOPS!'
          : extraInfo?.trapType === 'spring'
          ? 'BOING!'
          : extraInfo?.trapType === 'freeze'
          ? 'BRR!'
          : extraInfo?.trapType === 'tnt'
          ? 'BOOM!'
          : extraInfo?.trapType === 'glue'
          ? 'SMACK!'
          : 'ZAP!';
      break;
    case 'item':
      pool = (extraInfo?.itemType && ITEM_QUOTES[extraInfo.itemType]) || ['Bonus je můj!'];
      tag = 'WOW!';
      break;
    case 'capture':
      pool = CAPTURE[type];
      tag = Math.random() < 0.5 ? 'WHAM!' : 'K.O.!';
      break;
    case 'captured':
      pool = CAPTURED[type];
      tag = 'OOPS!';
      break;
    case 'select':
      pool = SELECT[type];
      tag = undefined;
      break;
    case 'promotion':
      speakerType = 'queen';
      pool = PROMOTION;
      tag = 'BAM!';
      break;
    case 'shield_block':
    case 'shield_bounce':
    case 'mirror_reflect':
    case 'hammer_smash':
    case 'rocket_jump':
    case 'extra_turn':
    case 'frozen':
    case 'lightning_strike':
    case 'magnet_pull':
    case 'tnt_blast':
    case 'glue_stuck':
    case 'special':
      pool = EFFECT_QUOTES[event === 'shield_bounce' ? 'shield_block' : event === 'special' ? 'extra_turn' : event];
      tag =
        event === 'hammer_smash'
          ? 'WHAM!'
          : event === 'rocket_jump'
          ? 'BOING!'
          : event === 'mirror_reflect'
          ? 'ZAP!'
          : event === 'shield_block' || event === 'shield_bounce'
          ? 'CRACK!'
          : event === 'lightning_strike'
          ? 'ZAP!'
          : event === 'tnt_blast'
          ? 'BOOM!'
          : 'POW!';
      break;
    case 'victory':
      speakerType = 'king';
      pool = ['Vítězství! Dnes se hoduje!', 'Sláva! Královské kuře pro všechny!', 'Já jsem to věděl od začátku!'];
      tag = 'BAM!';
      break;
    case 'defeat':
      speakerType = 'king';
      pool = ['Ne… to není možné…', 'Prohráli jsme… přineste mi kapesník.', 'Příště! Příště určitě!'];
      tag = 'OOPS!';
      break;
    default:
      pool = MOVE[type];
      tag = 'POW!';
  }

  return {
    speaker: SPEAKER_NAMES[speakerType],
    avatar: SPEAKER_AVATARS[speakerType],
    pieceType: speakerType,
    color: extraInfo?.color,
    text: pick(pool),
    comicTag: tag,
  };
}
