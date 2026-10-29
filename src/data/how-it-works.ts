// The How it works page (/how-it-works.html, /fr/how-it-works.html).
//
// The words stay in src/content/legal/<lang>/how-it-works.md, the place to
// edit them: this parses that Markdown at build time into sections and
// blocks, and HowItWorks.astro lays each section out (REDESIGN-BRIEF). Every
// rule and number on the page is the Markdown's own text. The few labels the
// design adds (step strip, card titles, stat labels) are in UI below.
import enRaw from '../content/legal/en/how-it-works.md?raw';
import frRaw from '../content/legal/fr/how-it-works.md?raw';

export type Lang = 'en' | 'fr';
export type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] };
export interface Section { title: string; blocks: Block[]; subs: { title: string; blocks: Block[] }[] }
export interface HowItWorks { title: string; meta: string; intro: Block[]; sections: Section[] }

/** Markdown in the subset the page uses: ## and ### headings, lists, one table, paragraphs. */
function parse(raw: string): HowItWorks {
  const [, front, body] = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)!;
  const meta = Object.fromEntries([...front.matchAll(/^(\w+):\s*(.*)$/gm)].map((m) => [m[1], m[2]]));
  const doc: HowItWorks = { title: meta.title, meta: meta.meta, intro: [], sections: [] };
  let target = doc.intro;
  for (const chunk of body.trim().split(/\n\s*\n/).map((c) => c.trim())) {
    if (chunk.startsWith('## ')) {
      const section: Section = { title: chunk.slice(3).trim(), blocks: [], subs: [] };
      doc.sections.push(section);
      target = section.blocks;
    } else if (chunk.startsWith('### ')) {
      const sub = { title: chunk.slice(4).trim(), blocks: [] as Block[] };
      doc.sections[doc.sections.length - 1].subs.push(sub);
      target = sub.blocks;
    } else {
      const lines = chunk.split('\n');
      if (lines.every((l) => l.startsWith('- '))) {
        target.push({ type: 'ul', items: lines.map((l) => l.slice(2).trim()) });
      } else if (lines[0].startsWith('|')) {
        const rows = lines.filter((l) => !/^\|[-| ]+\|$/.test(l)).map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        target.push({ type: 'table', head: rows[0], rows: rows.slice(1) });
      } else {
        target.push({ type: 'p', text: lines.map((l) => l.trim()).join(' ') });
      }
    }
  }
  return doc;
}

export const CONTENT: Record<Lang, HowItWorks> = { en: parse(enRaw), fr: parse(frRaw) };

/** Inline Markdown to HTML: **bold** and [links](url), everything else escaped. */
export function md(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/** "**Title:** rest" split into the title (without its colon) and the rest. */
export function lead(item: string): { title: string; rest: string } {
  const m = item.match(/^\*\*(.+?)\*\*\s*(.*)$/);
  if (!m) return { title: '', rest: item };
  let title = m[1].replace(/\s*:\s*$/, '');
  let rest = m[2];
  // "(free) :" style, where the plan sits after the bold label (fr).
  rest = rest.replace(/^:\s*/, '');
  // The text reads as its own sentence under a card title.
  rest = rest.charAt(0).toUpperCase() + rest.slice(1);
  return { title, rest };
}

/** A card title without the plan in brackets, which the badge shows instead. */
export function withoutPlan(title: string): string {
  return title.replace(/\s*\((free|gratuit|Club plan|formule Club|Pro)\)/i, '').trim();
}

/** Section anchors, the same in both languages, in the Markdown's order. */
export const IDS = ['checking-in', 'queue', 'picking', 'overrides', 'scores', 'board', 'signal', 'attendance', 'payments', 'plans', 'testing'];

export const UI = {
  en: {
    crumb: 'How it works',
    eyebrow: 'NextFour: How it works',
    steps: [
      { tag: 'Arrive', title: 'Check in', text: 'With the session code, at the courtside board, or via the organiser.' },
      { tag: 'Wait', title: 'Join the queue', text: 'Longest wait goes first. Everyone sees the same order.' },
      { tag: 'Pick', title: 'Make the four', text: 'Pegboard, skill-based, King of the Court or manual.' },
      { tag: 'Play', title: 'Play and score', text: 'Scores feed history and per-format ratings.' },
    ],
    stepsLabel: 'A club night in four steps',
    onThisPage: 'On this page',
    checkin: [
      { title: 'Your phone', text: "From your own phone with the session's check-in code.", plan: 'Free' },
      { title: 'Session Board', text: 'At a courtside tablet running the Session Board.', plan: 'Free' },
      { title: 'Organiser', text: 'By the organiser or a deputy.', plan: 'Free' },
      { title: 'QR and NFC', text: 'Pro adds a QR code to scan and an NFC tag to tap.', plan: 'Pro' },
    ],
    exampleQueue: 'Example queue',
    player: 'Player',
    away: 'away',
    notPickable: 'Not pickable',
    min: 'min',
    methodsLabel: 'Picking methods',
    refusesHeading: 'The server refuses any change that would',
    refuses: ['put a player on two games', "place someone who isn't checked in or is away", 'put two games on one court'],
    refusesAfter: 'Whoever sends it.',
    ratingStats: [['K-factor', '32'], ['Never below', '100'], ['Self-declared start', '1200–1800'], ['Otherwise', '1500']],
    boardPlans: ['Free', 'Free', 'Club', 'Pro'],
    attendancePlans: ['Free', 'Pro'],
    forOrganisers: 'For organisers',
    testStats: [['Players', '32'], ['Hours', '3'], ['Courts', '3–7']],
    testRules: 'Rules that must hold in every run',
    plans: { Free: 'Free', Performance: 'Performance', Pro: 'Pro', Club: 'Club' } as Record<string, string>,
    cta: {
      heading: 'Run your next club night on NextFour.',
      text: 'Hosting with pegboard or manual picking and the Session Board is free.',
      get: 'Get the app',
      second: 'Find a club night',
    },
  },
  fr: {
    crumb: 'Comment ça marche',
    eyebrow: 'NextFour : Comment ça marche',
    steps: [
      { tag: 'Arriver', title: 'S’enregistrer', text: 'Avec le code de la session, sur le tableau au bord du terrain, ou par l’organisateur.' },
      { tag: 'Attendre', title: 'Rejoindre la file', text: 'Le plus long temps d’attente d’abord. Tout le monde voit le même ordre.' },
      { tag: 'Choisir', title: 'Composer le match', text: 'Pegboard, par niveau, Roi du terrain ou manuel.' },
      { tag: 'Jouer', title: 'Jouer et noter le score', text: 'Les scores alimentent l’historique et les classements par format.' },
    ],
    stepsLabel: 'Une soirée de club en quatre étapes',
    onThisPage: 'Sur cette page',
    checkin: [
      { title: 'Votre téléphone', text: 'Depuis son téléphone avec le code d’enregistrement de la session.', plan: 'Gratuit' },
      { title: 'Tableau de session', text: 'Sur une tablette au bord du terrain qui affiche le tableau de session.', plan: 'Gratuit' },
      { title: 'Organisateur', text: 'Par l’organisateur ou un adjoint.', plan: 'Gratuit' },
      { title: 'QR code et NFC', text: 'Pro ajoute un QR code à scanner et une puce NFC à toucher.', plan: 'Pro' },
    ],
    exampleQueue: 'Exemple de file',
    player: 'Joueur',
    away: 'absent',
    notPickable: 'Ne peut pas être choisi',
    min: 'min',
    methodsLabel: 'Modes de sélection',
    refusesHeading: 'Le serveur refuse tout changement qui',
    refuses: ['mettrait un joueur sur deux matchs', 'placerait quelqu’un qui n’est pas enregistré ou est absent', 'mettrait deux matchs sur un terrain'],
    refusesAfter: 'Quel que soit l’expéditeur.',
    ratingStats: [['Facteur K', '32'], ['Jamais sous', '100'], ['Niveau déclaré', '1200–1800'], ['Sinon', '1500']],
    boardPlans: ['Gratuit', 'Gratuit', 'Club', 'Pro'],
    attendancePlans: ['Gratuit', 'Pro'],
    forOrganisers: 'Pour les organisateurs',
    testStats: [['Joueurs', '32'], ['Heures', '3'], ['Terrains', '3–7']],
    testRules: 'Les règles qui doivent tenir à chaque simulation',
    plans: { Gratuit: 'Gratuit', Performance: 'Performance', Pro: 'Pro', Club: 'Club' } as Record<string, string>,
    cta: {
      heading: 'Organisez votre prochaine soirée de club sur NextFour.',
      text: 'Organiser avec la sélection Pegboard ou manuelle et le tableau de session est gratuit.',
      get: 'Obtenir l’application',
      second: 'Trouver une soirée de club',
    },
  },
};

/** The free plan's name in either language, for badge colours. */
export const FREE = new Set(['Free', 'Gratuit']);
