export type Clue = {
  value: number;
  clue: string;
  answer: string;
};

export type Category = {
  title: string;
  clues: Clue[];
};

const values = [200, 400, 600, 800, 1000] as const;

function cat(title: string, clues: [string, string][]): Category {
  return {
    title,
    clues: clues.map(([clue, answer], i) => ({
      value: values[i],
      clue,
      answer,
    })),
  };
}

/** 60s/70s for the grown-ups, kid culture for the 12-year-olds. Easy up top, harder down. */
export const BOARD: Category[] = [
  cat("VINYL", [
    ["This British quartet played the Ed Sullivan Show in 1964.", "The Beatles"],
    ['She asked us for a little "Respect" in 1967.', "Aretha Franklin"],
    ["Queen's 1975 opera-rock single that radio DJs feared to play in full.", "Bohemian Rhapsody"],
    ['This 1971 Marvin Gaye album asked a question about the state of the world.', "What's Going On"],
    ["Stevie Wonder's 1973 album with \"Living for the City.\"", "Innervisions"],
  ]),
  cat("THE MOON", [
    ["He was the first human to walk on the Moon.", "Neil Armstrong"],
    ["This NASA program landed men on the Moon.", "Apollo"],
    ["This 1969 broadcast let 650 million people watch a man walk somewhere new.", "Apollo 11 / the Moon landing"],
    ["Second man on the Moon, same walk as Armstrong.", "Buzz Aldrin"],
    ["1968 photo of Earth rising over the lunar horizon.", "Earthrise"],
  ]),
  cat("SITCOMS", [
    ["This blended family had six kids, a housekeeper named Alice, and a theme you can hum.", "The Brady Bunch"],
    ["Archie Bunker argued from his armchair on this show.", "All in the Family"],
    ["These two roommates were Laverne and…", "Shirley"],
    ["This 1970s show followed a Korean War medical unit; its theme was whistled.", "M*A*S*H"],
    ["On Happy Days, this leather-jacketed greaser said “Ayy” and “sit on it.”", "Fonzie / The Fonz"],
  ]),
  cat("WHEELS", [
    ["Ford's sporty 1964 pony car.", "Mustang"],
    ["This VW bus became a hippie house on wheels.", "Microbus / Transporter"],
    ["This little VW bug was Germany’s “people’s car.”", "Beetle / Bug"],
    ["Pontiac’s 1960s muscle car, three letters that meant goat to some.", "GTO"],
    ["GM's 1970s rear-drive luxury barge from Cadillac — DeVille or this sister ship.", "Fleetwood"],
  ]),
  cat("PIXEL", [
    ["This green exploding mob is the last thing you want behind you in Minecraft.", "a Creeper"],
    ["This yellow Pokémon is the mascot of the whole franchise.", "Pikachu"],
    ["In this game you leap from the Battle Bus and try to be the last one standing.", "Fortnite"],
    ["On Roblox, this pet-and-house game is where kids trade neon legendaries.", "Adopt Me"],
    ["In Minecraft’s Nether, this mob guards fortresses and shoots fireballs. You farm it for rods.", "a Blaze"],
  ]),
  cat("BACKPACK", [
    ["This boy wizard has a lightning-bolt scar on his forehead.", "Harry Potter"],
    ["Jeff Kinney’s cartoon diary of a middle-schooler named Greg.", "Diary of a Wimpy Kid (Greg Heffley)"],
    ["Dav Pilkey’s half-dog, half-man cop who eats with his face.", "Dog Man"],
    ["In Encanto, she’s the only Madrigal grandchild with no magical gift.", "Mirabel"],
    ["This jittery orange emotion joined Joy and Sadness in a 2024 Pixar sequel.", "Anxiety"],
  ]),
];

export function clueKey(categoryIndex: number, rowIndex: number) {
  return `${categoryIndex}-${rowIndex}`;
}
