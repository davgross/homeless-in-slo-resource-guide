#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Custom whitelist for domain-specific terms
const WHITELIST = new Set([
  // Organizations, agencies, programs, and services
  'CAPSLO', 'ECHO', 'CHC', 'TMHA', 'HASLO', 'SLOLAF', 'CASA', 'GALA', 'NAMI', 'ACLU', 'IHSS', 'WIC',
  'HiCAP', 'GLAD', 'UndocuSupport', 'CalWORKS', 'CalFresh', 'CenCali', 'CenCal', 'Medi-Cal', 'Medi',
  'FamilyPACT', 'PathPoint', 'SmartShare', 'Womenade', 'SESLOC', 'CoastHills', 'SLOCOG', 'RTA',
  'YMCA', 'KOA', 'CCADRC', 'CCATC', 'CCDS', 'CHC', 'CES', 'BHBH', 'HCHP', 'HSP', 'MISP', 'MHET',
  'UndocuSupport', 'NeighborAid', 'FamilyPACT', 'TranzCentralCoast', 'BlackHorse', 'MakerSpace',
  'EmergencySlo', 'CloudLibrary', 'LearningExpress', 'Tri', 'Lifepoint', 'Universalists', 'Cuesta',
  'MedStop', 'Eckerd', 'UnitedHealthcare', 'Lifesigns', 'LifeSteps', 'Freecycle', 'Kreuzberg',
  'Mindbody', 'CalTrans', 'CalWORKs', 'Isabell', 'SLOCo', 'Nar', 'Homekey', 'Runabout',
  'Paratransit', 'RecycleFest', 'NeedyMeds', 'EyeCare', 'HouseKeys', 'MyHouseKeys', 'BenefitsCal',
  'CalConnect', 'AlertSLO', 'PrepareSLO', 'Foodshare', 'ReStore', 'HomeShare', 'Bangers', 'Kritter',
  'StateSideLegal', 'HelpSLO', 'VivaSLO', 'NavSLO', 'CalFRESH', 'FlexJobs', 'CalRecycle', 'myEDD',
  'WestLaw', 'OnLaw', 'InfantSEE', 'LifeLine', 'iRideshare', 'Calendly', 'Denti', 'VetWell',
  'Vento', 'Safeline', 'Warmline', 'BikeLink', 'CalFresh', 'RiderPortal', 'moovit', 'Noor',
  'Lumina', 'Aegis', 'Aevum', 'Genoa', 'Tikva', 'Agape', 'Alano', 'Arise', 'Vineyard', 'Loaves',
  'Fishes', 'Terrace', 'Sunny', 'Acres', 'Rapha', 'LyonHeart', 'Parkwood', 'Vituity', 'Waterman',
  'Middlehouse', 'Gryphon', 'Removery', 'nitiative', 'Orfalea', 'beermoney', 'EPaCE', 'HiSET',
  'AirTalk', 'enTouch', 'Kanopy', 'Brainfuse', 'ParentConnectionSLO', 'LinkedIn', 'SkillsBuild',
  'HelpNow', 'eLearning', 'EBSCOlearning', 'ProCitizen',

  // Common abbreviations
  'CalJOBS', 'DMV', 'SSI', 'SSDI', 'SSA', 'TTY', 'TDD', 'CRV', 'RV', 'RVs', 'LGBTQ', 'LGBTQIA',
  'ESL', 'GED', 'PC290', 'PDF', 'URL', 'URLs', 'App', 'app', 'Ctrl', 'Alt', 'Cmd', 'LGBTQ+',
  'STD', 'SoCal', 'Wi', 'Fi',

  // Days and times
  'M-F', 'M-Th', 'Tu-Sa', 'am', 'pm', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mo', 'Tu',
  'We', 'Th', 'Fr', 'Sa', 'Su',

  // Place names
  'SLO', 'Obispo', 'Atascadero', 'Arroyo', 'Grande', 'Cayucos', 'Cambria', 'Nipomo', 'Oceano',
  'Templeton', 'Morro', 'Grover', 'Pismo', 'Avila', 'Los', 'Osos', 'San', 'Luis', 'Miguel',
  'Margarita', 'Shandon', 'Creston', 'Paso', 'Robles', 'Baywood', 'Simeon', 'Estero', 'Woodlands',
  'Callender', 'Betteravia', 'Orcutt', 'Guadalupe', 'Santa', 'Maria', 'Halcyon', 'Leoni',
  'Rockaway', 'Barka', 'Balay', 'Ko', 'Toscano', 'Moylan', 'El', 'Camino', 'Solana', 'Laguna',
  'Ventura', 'Carmel', 'Tiburon', 'Goleta', 'Cuyama', 'Cotchett', 'Wye', 'Shamel',

  // Street types and names
  'St', 'Ave', 'Rd', 'Dr', 'Blvd', 'Ln', 'Ct', 'Cir', 'Pkwy', 'Pl', 'Higuera', 'Monterey',
  'Foothill', 'Broad', 'Prado', 'Marsh', 'Johnson', 'Phillips', 'Kendall', 'Southwood', 'Oceano',
  'Brizzolara', 'Chorro', 'Trouville', 'Oceanaire', 'Tefft', 'Zaca', 'Aerovista', 'Leff', 'Islay',
  'Quintana', 'Calle', 'Manzanita', 'Sunnyside', 'Madera', 'Tulare', 'Fredericks', 'Dalidio',
  'Loomis', 'Tolosa', 'Curbaril', 'Paseo', 'Parkview', 'Lawton', 'Longbranch', 'Hollister', 'Napa',
  'Ferrini', 'Woodbridge', 'Toro', 'Fernwood', 'Eto', 'Descanso', 'Campo', 'Cerro', 'Romauldo',
  'Stoneridge', 'Rockview', 'Bannon', 'Empresa', 'Tamson', 'Trigo', 'Fiero', 'Farroll', 'Bello',
  'Niblick', 'Ysabel', 'Ardilla', 'Clarkie', 'Viento', 'Esparto', 'Noveno', 'Pinecove', 'Pereira',
  'Wavertree', 'Nickerson', 'Portola', 'Empleo', 'Posada', 'Bluerock', 'Earthwood', 'Fel',
  'Kilbern', 'Entrada', 'Breck', 'Corrida',

  // Personal Names
  'Anna', 'Judson', 'DeVaul', 'Macadero', 'Cleaver', 'Clark', 'Halcyon', 'Willow', 'Madonna',
  'Marvin', 'Lizzie', 'Betty', 'Bettys', 'Woodson', 'Grayson', 'Ariana', 'Nielson', 'Lamore',
  'Vania', 'Agama', 'Layne', 'Rupe', 'Jauregui', 'Bruse', 'Rossi', 'Villalobos', 'Dowler',
  'Rocio', 'Anaya', 'Butz',

  // Misc
  'website', 'email', 'voicemail', 'hotline', 'nonprofit', 'unhoused', 'rehousing', 'parolee',
  'parolees', 'COVID', 'COVID-19', 'telehealth', 'telemedicine', 'rideshare', 'ridesharing',
  'carpool', 'carpooling', 'copay', 'copays', 'deductible', 'coinsurance', 'waitlist', 'waitlisted',
  'waitlisting', 'dropdown', 'checkbox', 'signup', 'login', 'apps', 'smartphone', 'smartphones',
  'ok', 'OK', 'okay', 'Okay', 'psych', 'psychiatric', 'psychiatry', 'meds', 'rehab', 'detox',
  'VitalChek', 'NaloxBoxes', 'DD214', 'Narcan', 'naloxone', 'Naloxone', 'suboxone', 'Suboxone',
  'buprenorphine', 'fentanyl', 'benzodiazepines', 'homebound', 'farmworkers', 'responders',
  'underserved', 'iCloud', 'iPhones', 'Wi-Fi', 'hotspots', 'Uber', 'Lyft', 'vanpool', 'motorhome',
  'jobseekers', 'résumé', 'bootcamp', 'bootcamps', 'prediabetes', 'microchipping', 'décor',
  'mentorship', 'onboarding', 'unenrolled', 'homeownership', 'homebuilding', 'Vite', 'DOMPurify',
  'subreddit', 'pilates', 'tai', 'pwa', 'md', 'vite', 'hemoccult', 'hydrocortisone',
  'victimizer', 'preparer', 'farmworker', 'unpermitted', 'unburned', 'analytics', 'cybersecurity',
  'rangeland', 'hotspot',

  // Hyphenated prefixes
  'pre', 'tri',

  // Common contractions and informal
  "don't", "doesn't", "didn't", "won't", "can't", "isn't", "aren't", "weren't", "wasn't", "haven't",
  "hasn't", "hadn't", "shouldn't", "wouldn't", "couldn't", "you're", "they're", "we're", "it's",
  "that's", "there's", "here's", "what's", "who's", "where's", "you've",

  "don’t", "doesn’t", "didn’t", "won’t", "can’t", "isn’t", "aren’t", "weren’t", "wasn’t", "haven’t",
  "hasn’t", "hadn’t", "shouldn’t", "wouldn’t", "couldn’t", "you’re", "they’re", "we’re", "it’s",
  "that’s", "there’s", "here’s", "what’s", "who’s", "where’s", "you’ve",

  // Possessives
  "Foxy's", "Poly's",
  "Foxy’s", "Poly’s",
  
  // Words that might be flagged but are valid
  'pantries', 'thrift', 'thrifting', 'recycler', 'recyclers', 'respite', 'recuperative', 'sobering',
  'detox', 'eligibility', 'ineligible', 'uninsured', 'underinsured', 'homeless', 'homelessness',
  'houseless', 'unsheltered', 'subsidized', 'subsidize', 'copayment', 'copayments', 'symptom',
  'symptoms', 'syndrome', 'syndromes', 'strengths', 'lengthy', 'vet', 'vets', 'veteran', 'veterans',
  'sober', 'sobriety', 'outpatient', 'inpatient', 'psychology', 'opioid', 'benzodiazepine',

  // Spanish and Latin
  'familia', 'por', 'todo', 'nueva', 'generación', 'buena', 'de', 'capita', 'et', 'cetera',
  'español', 'Español', 'Mixteco', 'cortina', 'del', 'brisas', 'norte', 'd’Arroyo', 'Indigena',
]);

// Simple dictionary of common words (you could expand this or use a larger dictionary)
const BASIC_DICTIONARY = new Set([
  // This would normally be much larger, but for demonstration purposes
  // We'll rely mostly on the whitelist and basic checks
]);

// Patterns to skip
const SKIP_PATTERNS = [
  /^https?/i,                // Starts with http or https (any URL)
  /^ftp/i,                   // Starts with ftp
  /^www\./i,                 // Starts with www.
  /^mailto:/i,               // Email links
  /^tel:/i,                  // Phone links
  /^sms:/i,                  // SMS links
  /\.(org|com|gov|edu|net|io|co|uk|us|ca|au|church|info|biz|guide)$/i,  // Ends with domain extension
  /^\d{3}-\d{3}-\d{4}/,      // Phone numbers
  /^\d+$/,                   // Pure numbers
  /^[A-Z]{2,}$/,             // All caps (likely acronyms not in whitelist)
  /^#/,                      // Hashtags
  /^@/,                      // Mentions at-signs
  /^\$\d+/,                  // Prices
  /^\d+%$/,                  // Percentages
  /^\d+(?:st|nd|rd|th)$/,    // Ordinals
  /^[A-Z]\d+/,               // Room numbers like B4, etc.
  /@/,                       // Contains @ (email addresses)
  /\//,                      // Contains / (URL fragments, paths)
  /^x\d+$/i,                 // Extension numbers like x123
  /^\d+&#/,                  // HTML entities
  /^M\/.*\/F$/,              // Date ranges like M/W/F
  /^[MTWFS][a-z]?\/[MTWFS]/, // Date ranges like Tu/W/Th
  /^[A-Z][a-z]+\'s$/,        // Possessives with capital letter
  /^[A-Z][a-z]+’$/,          // Possessives with capital letter
  /^\d+x$/i,                 // Frequency indicators like 8x
  /\.(html|htm|php|asp|aspx|jsp|pdf|doc|docx|xls|xlsx|txt)$/i,  // File extensions
];

// Extract words from markdown while skipping syntax
function extractWords(markdown) {
  const words = [];
  let inCodeBlock = false;
  let inInlineCode = false;
  let inLink = false;
  let inHtml = false;

  const lines = markdown.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // Check for code blocks
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Skip HTML comments
    if (line.trim().startsWith('<!--')) {
      inHtml = true;
    }
    if (inHtml) {
      if (line.includes('-->')) {
        inHtml = false;
      }
      continue;
    }

    // Skip certain markdown lines
    if (line.trim().startsWith('|')) continue; // Table rows
    if (line.trim().match(/^[#]+\s/)) {
      // Process heading but skip the # symbols
      const heading = line.replace(/^[#]+\s+/, '');
      processLine(heading, lineNum + 1);
      continue;
    }

    processLine(line, lineNum + 1);
  }

  function processLine(text, lineNum) {
    // Remove inline code
    text = text.replace(/`[^`]+`/g, ' ');

    // Remove bare URLs (http://, https://, ftp://, etc.)
    text = text.replace(/\b(?:https?|ftp|file):\/\/[^\s]+/gi, ' ');

    // Remove www. URLs
    text = text.replace(/\bwww\.[^\s]+/gi, ' ');

    // Remove email addresses
    text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, ' ');

    // Remove domain-looking patterns (something.org, subdomain.something.com, etc.)
    // Also captures paths after domains (e.g., example.com/page.html)
    // Handles domains with dashes (e.g., my-domain.com)
    text = text.replace(/\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(org|com|gov|edu|net|io|co|uk|us|ca|au|church|info|biz|guide)([^\s]*)/gi, ' ');

    // Remove markdown links but keep the link text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Remove markdown formatting
    text = text.replace(/[*_~]/g, '');

    // Split into words
    const lineWords = text.split(/[\s,;:.()\[\]{}"”!?—–-]+/);

    for (const word of lineWords) {
      if (word.length === 0) continue;

      // Clean up word
      const cleaned = word.replace(/^['"‘“]|['’"”]$/g, '');
      if (cleaned.length === 0) continue;

      words.push({ word: cleaned, line: lineNum });
    }
  }

  return words;
}

// Check if a word should be skipped
function shouldSkip(word) {
  // Skip if in whitelist (case-insensitive)
  if (WHITELIST.has(word) || WHITELIST.has(word.toLowerCase()) || WHITELIST.has(word.toUpperCase())) {
    return true;
  }

  // Skip if matches any skip pattern
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(word)) {
      return true;
    }
  }

  // Skip possessives - check base word
  if (word.endsWith("'s") || word.endsWith("’s")) {
    const baseWord = word.slice(0, -2);
    return shouldSkip(baseWord);
  }
  if (word.endsWith("'") || word.endsWith("’")) {
    const baseWord = word.slice(0, -1);
    return shouldSkip(baseWord);
  }

  // Skip plurals - check singular
  if (word.endsWith('s') && word.length > 2) {
    const singular = word.slice(0, -1);
    if (WHITELIST.has(singular) || WHITELIST.has(singular.toLowerCase())) {
      return true;
    }
  }

  return false;
}

// Use aspell to check if words are misspelled
// Returns a Set of misspelled words
function checkWithAspell(words) {
  if (words.length === 0) return new Set();

  // Create unique list of words to check
  const uniqueWords = [...new Set(words)];

  // Join words with newlines for aspell input
  const input = uniqueWords.join('\n');

  // Run aspell in list mode
  // -a = interactive mode that lists misspelled words
  // list mode outputs one word per line for unrecognized words
  const result = spawnSync('aspell', ['list'], {
    input: input,
    encoding: 'utf8'
  });

  if (result.error) {
    console.error('Error running aspell:', result.error.message);
    console.error('Make sure aspell is installed: sudo apt-get install aspell');
    process.exit(1);
  }

  // Parse aspell output - it returns misspelled words, one per line
  const misspelled = new Set(
    result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  );

  return misspelled;
}

// Main function
function checkSpelling(filePath) {
  console.log(`\nChecking ${filePath}...`);

  const content = fs.readFileSync(filePath, 'utf8');
  const words = extractWords(content);

  // First pass: filter by whitelist and skip patterns
  // Keep track of word -> line numbers mapping
  const wordsToCheck = new Map(); // word -> array of line numbers
  const candidateWords = []; // unique words to send to aspell

  for (const { word, line } of words) {
    if (shouldSkip(word)) continue;

    if (!wordsToCheck.has(word)) {
      wordsToCheck.set(word, []);
      candidateWords.push(word);
    }
    wordsToCheck.get(word).push(line);
  }

  if (candidateWords.length === 0) {
    console.log('  ✓ No words to check (all whitelisted or skipped)');
    return 0;
  }

  // Second pass: check with aspell
  const misspelled = checkWithAspell(candidateWords);

  // Filter to only words that aspell thinks are misspelled
  const suspiciousWords = new Map();
  for (const [word, lines] of wordsToCheck.entries()) {
    if (misspelled.has(word)) {
      suspiciousWords.set(word, lines);
    }
  }

  if (suspiciousWords.size === 0) {
    console.log('  ✓ No misspelled words found');
    return 0;
  }

  console.log(`  Found ${suspiciousWords.size} potentially misspelled word(s):\n`);

  // Sort by frequency
  const sorted = Array.from(suspiciousWords.entries())
    .sort((a, b) => b[1].length - a[1].length);

  for (const [word, lines] of sorted) {
    const uniqueLines = [...new Set(lines)].sort((a, b) => a - b);
    const lineList = uniqueLines.length > 5
      ? `${uniqueLines.slice(0, 5).join(', ')}... (${uniqueLines.length} total)`
      : uniqueLines.join(', ');
    console.log(`  • "${word}" (${lines.length}x) on line(s): ${lineList}`);
  }

  return suspiciousWords.size;
}

// Run on specified files
const files = ['Directory.md', 'Resource guide.md', 'About.md'];
let totalIssues = 0;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    totalIssues += checkSpelling(filePath);
  } else {
    console.log(`\nWarning: ${file} not found`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Total potentially misspelled words: ${totalIssues}`);
console.log(`\nNote: Using aspell for spell checking with custom whitelist.`);
console.log(`Add domain-specific terms to the WHITELIST in spell-check.js`);
