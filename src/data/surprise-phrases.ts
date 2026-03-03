/**
 * Curated pool of ~50 diverse, evocative phrases for the "Surprise me" feature.
 *
 * Each entry should produce visually distinct artwork through the analysis
 * pipeline. Variety spans: length (2 words to multi-sentence), tone (playful,
 * serious, technical, whimsical), and text structure (prose, verse, code,
 * lists, dialogue).
 */
export const SURPRISE_PHRASES: string[] = [
  // Famous opening lines
  'It was the best of times, it was the worst of times.',
  'Call me Ishmael.',
  'In a hole in the ground there lived a hobbit.',
  'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
  'All happy families are alike; each unhappy family is unhappy in its own way.',
  'The sky above the port was the color of television, tuned to a dead channel.',

  // Evocative sentences
  'The last sunlight turned the ocean into liquid gold.',
  'She whispered secrets to the stars and they whispered back.',
  'Rain drummed on the tin roof like a thousand tiny fingers.',
  'The old library smelled of dust, leather, and forgotten afternoons.',
  'A single candle flame danced in the window of the empty house.',
  'The train whistle echoed through the valley at midnight.',

  // Fun facts
  'Octopuses have three hearts and blue blood.',
  'Honey never spoils -- archaeologists found edible honey in Egyptian tombs.',
  'A group of flamingos is called a flamboyance.',
  'The shortest war in history lasted 38 minutes.',
  'Venus rotates so slowly that a day there lasts longer than its year.',
  'Bananas are berries, but strawberries are not.',

  // Recipes and instructions
  'Fold the butter into the flour until it resembles coarse breadcrumbs.',
  'Plant the seeds one inch deep, water gently, and wait.',
  'Whisk three eggs with a pinch of salt, then pour into the hot skillet.',
  'Simmer the broth with bay leaves and thyme for two hours on low heat.',

  // Poetry fragments
  'Do not go gentle into that good night.',
  'I wandered lonely as a cloud that floats on high o\'er vales and hills.',
  'Two roads diverged in a wood, and I took the one less traveled by.',
  'Hope is the thing with feathers that perches in the soul.',
  'Shall I compare thee to a summer\'s day? Thou art more lovely and more temperate.',
  'Tyger Tyger, burning bright, in the forests of the night.',

  // Technical and code
  'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2) }',
  'SELECT name, age FROM users WHERE active = true ORDER BY created_at DESC',
  'The TCP three-way handshake begins with SYN, responds with SYN-ACK, and completes with ACK.',
  'In Big O notation, binary search runs in O(log n) time.',

  // Names and short phrases
  'Alexander Hamilton',
  'Tokyo at midnight',
  'The color blue',
  'Monday morning coffee',
  'A fox in winter',
  'The sound of rain',

  // Philosophical
  'If a tree falls in a forest and no one is around to hear it, does it make a sound?',
  'I think, therefore I am.',
  'The only thing I know is that I know nothing.',
  'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',

  // Whimsical
  'The moon is made of stories and the tides carry them to shore.',
  'Somewhere between Tuesday and forever, a cat learned to play piano.',
  'The clouds had a meeting and decided to rain only on Mondays.',
  'Every snowflake is a love letter from the sky to the ground.',

  // Multi-sentence / longer
  'The garden was quiet. Morning dew clung to every petal and blade of grass. A robin landed on the fence, tilted its head, and began to sing.',
  'At precisely 3:47 AM, the lighthouse keeper noticed something unusual in the fog. A ship, older than any he had ever seen, drifted silently toward the rocks.',
  'The recipe calls for patience: let the dough rise twice, punch it down gently, shape it into rounds, and bake until the crust sings when you tap it.',

  // Mixed language / global
  'Carpe diem, quam minimum credula postero.',
  'Wabi-sabi: finding beauty in imperfection.',
];
