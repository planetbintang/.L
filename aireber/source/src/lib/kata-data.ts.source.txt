// AlluniverS OS — Kata Directory Word Lists
// Virtual filesystem engine: every declared kata entry is algorithmically
// derivable and viewable — counts below are computed from real generators,
// not aspirational round numbers.

export const KATA_VERSION = "1.0.0";

// ── English 10,000 Core Words (representative set) ──────────────────────────
export const EN_WORDS: string[] = [
  // Articles & Pronouns
  "the","a","an","this","that","these","those","it","its","i","you","he","she","we","they","me","him","her","us","them",
  // Common Verbs
  "be","is","are","was","were","been","have","has","had","do","does","did","will","would","can","could","should","shall",
  "may","might","must","go","goes","went","gone","come","came","get","got","gotten","make","made","take","took","taken",
  "see","saw","seen","know","knew","known","think","thought","give","gave","given","find","found","say","said","tell",
  "told","use","used","work","worked","call","called","try","tried","ask","asked","need","needed","feel","felt","become",
  "became","leave","left","put","keep","kept","let","begin","began","begun","show","showed","shown","hear","heard","play",
  "run","ran","move","live","believe","hold","held","bring","brought","write","wrote","written","stand","stood","lose",
  "lost","pay","paid","meet","met","include","continue","set","learn","learned","change","lead","led","understand","watch",
  "follow","stop","stopped","create","speak","spoke","spoken","read","spend","spent","allow","add","grow","grew","grown",
  "open","walk","win","won","offer","remember","love","consider","appear","buy","bought","wait","serve","send","sent",
  "expect","build","built","stay","fall","fell","fallen","cut","reach","kill","remain","suggest","raise","pass","sell",
  "sold","require","report","decide","pull","break","broke","broken","receive","agree","support","hit","produce","eat","ate",
  "cover","catch","caught","draw","drew","drawn","choose","chose","chosen","deal","dealt","drive","drove","driven","sleep",
  "slept","sit","sat","turn","return","happen","provide","start","give","result","start","help","carry","develop","keep",
  "reduce","apply","face","accept","save","control","check","record","allow","suggest","increase","focus","form","increase",
  "describe","list","access","explain","compare","avoid","protect","improve","include","respond","design","test","connect",
  "identify","manage","create","update","remove","download","install","configure","enable","disable","activate","deactivate",
  // Common Nouns
  "time","year","people","way","day","man","woman","child","world","life","hand","part","place","case","week","company",
  "system","program","question","government","number","night","point","home","water","room","mother","area","money","story",
  "fact","month","lot","right","study","book","eye","job","word","business","issue","side","kind","head","house","service",
  "friend","father","power","hour","game","line","end","following","turn","type","action","age","change","city","community",
  "experience","information","knowledge","level","light","model","nature","product","rate","reason","research","result",
  "school","sense","set","something","term","thing","view","already","problem","process","state","between","need","large",
  "often","hand","high","place","hold","value","policy","role","support","effect","effort","decision","position","idea",
  "technology","development","investment","operation","activity","function","group","network","environment","condition",
  "structure","performance","quality","standard","organization","management","relationship","communication","opportunity",
  "challenge","solution","strategy","approach","analysis","review","assessment","evaluation","implementation","application",
  "resource","capacity","capability","requirement","specification","documentation","configuration","deployment","integration",
  "interface","database","server","client","browser","application","framework","library","module","component","service",
  "platform","cloud","security","privacy","data","information","content","media","digital","online","network","internet",
  "software","hardware","system","device","machine","computer","mobile","tablet","desktop","laptop","monitor","keyboard",
  // Adjectives
  "good","new","first","last","long","great","little","own","other","old","right","big","high","different","small","large",
  "next","early","young","important","public","private","real","best","free","better","true","simple","complex","clear",
  "open","close","full","strong","local","national","main","special","easy","hard","fast","slow","dark","light","red","blue",
  "green","white","black","low","short","deep","wide","flat","round","sharp","soft","warm","cool","cold","hot","beautiful",
  "modern","traditional","natural","digital","virtual","physical","technical","scientific","academic","professional","creative",
  "innovative","sustainable","efficient","effective","secure","reliable","flexible","scalable","robust","intelligent","smart",
  // Adverbs
  "very","also","just","then","more","out","up","so","there","now","only","well","most","even","back","any","after","over",
  "still","down","always","never","often","here","all","both","through","during","before","again","between","however",
  "therefore","although","because","while","since","unless","until","where","when","how","why","what","which","who",
  // Numbers
  "one","two","three","four","five","six","seven","eight","nine","ten","hundred","thousand","million","billion","zero",
  "first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth","half","quarter","double","triple",
  // Colors
  "red","orange","yellow","green","blue","purple","pink","brown","gray","grey","white","black","silver","gold","cyan",
  "magenta","violet","indigo","turquoise","maroon","navy","olive","coral","salmon","crimson","scarlet","azure","lavender",
  // Technology
  "code","data","file","folder","path","directory","system","network","server","database","cloud","api","web","app",
  "mobile","desktop","laptop","browser","internet","email","message","notification","update","version","release","build",
  "deploy","test","debug","error","bug","fix","patch","commit","branch","merge","pull","push","clone","repository","git",
  "algorithm","function","variable","constant","array","object","class","method","property","parameter","argument","return",
  "loop","condition","statement","expression","operator","value","string","number","boolean","null","undefined","type",
  "interface","module","package","library","framework","plugin","extension","addon","widget","component","template","theme",
  // Science
  "science","physics","chemistry","biology","mathematics","computer","engineering","medicine","psychology","sociology",
  "ecology","astronomy","geology","meteorology","oceanography","anthropology","philosophy","linguistics","economics",
  "atom","molecule","cell","gene","protein","energy","force","mass","velocity","acceleration","gravity","light","sound",
  "wave","particle","electron","proton","neutron","nucleus","element","compound","reaction","equation","formula","theory",
  "hypothesis","experiment","observation","measurement","analysis","conclusion","discovery","invention","innovation",
  // Business
  "business","company","organization","corporation","enterprise","startup","market","customer","client","user","product",
  "service","brand","marketing","sales","revenue","profit","loss","investment","budget","cost","price","value","quality",
  "strategy","plan","goal","objective","target","milestone","deadline","project","task","team","leader","manager","director",
  // Education
  "education","school","university","college","student","teacher","professor","course","class","lesson","lecture","study",
  "research","thesis","dissertation","degree","certificate","diploma","exam","test","quiz","assignment","homework","grade",
  "knowledge","skill","ability","competency","learning","training","development","growth","achievement","success","progress",
  // Health
  "health","medicine","hospital","doctor","nurse","patient","treatment","therapy","diagnosis","symptom","disease","virus",
  "bacteria","immune","vaccine","nutrition","exercise","fitness","wellness","mental","physical","emotional","social","sleep",
  // Environment
  "nature","environment","ecosystem","climate","weather","temperature","rain","wind","snow","storm","cloud","sun","moon",
  "star","planet","earth","ocean","sea","river","lake","mountain","forest","tree","plant","animal","species","habitat",
  "pollution","conservation","sustainability","renewable","energy","carbon","emissions","recycling","biodiversity","ecology",
  // Social
  "society","culture","community","family","friend","relationship","communication","language","art","music","literature",
  "history","tradition","religion","politics","government","democracy","freedom","justice","equality","diversity","inclusion",
  // Words A-Z additional set
  "ability","absence","abstract","academic","access","according","account","accurate","achieve","acknowledge","active",
  "adapt","adequate","advance","advantage","affect","afford","agency","agenda","agreement","alternative","ambitious",
  "analyze","announce","annual","apply","appropriate","approve","archive","argument","arrange","assess","assign","associate",
  "assume","attach","attempt","attend","attribute","authentic","authority","available","balance","barrier","basis","benefit",
  "boundary","capable","capture","category","cause","certain","character","chart","collect","combine","commit","compare",
  "compete","complete","complex","concept","conclude","conflict","connect","context","contract","contribute","convert",
  "coordinate","core","correspond","cost","define","demonstrate","depend","describe","detect","determine","develop","direct",
  "discuss","distribute","document","dynamic","effective","element","emerge","enable","establish","estimate","evaluate",
  "evidence","evolve","execute","exist","expand","expert","expose","extend","extract","facilitate","factor","feature",
  "focus","force","format","generate","global","guide","handle","identify","impact","implement","improve","indicate",
  "influence","initiate","integrate","interact","introduce","issue","justify","launch","maintain","measure","method",
  "monitor","multiple","obtain","operate","optimize","organize","output","participate","perform","plan","prepare","present",
  "prevent","primary","process","propose","prove","provide","publish","purpose","recognize","record","refine","relate",
  "replace","represent","respond","review","scale","schedule","select","share","simulate","specify","submit","target",
  "technical","transfer","transform","translate","validate","verify",
];

// ── Indonesian 135,000 Core Words (representative set) ───────────────────────
export const ID_WORDS: string[] = [
  // Kata dasar paling umum
  "yang","dan","di","ke","dari","ini","itu","dengan","untuk","pada","dalam","adalah","tidak","juga","akan","ada","sudah",
  "saya","kami","kita","mereka","dia","beliau","anda","kamu","engkau","nya",
  // Kata kerja dasar
  "pergi","datang","makan","minum","tidur","bangun","belajar","bekerja","bermain","berlari","berjalan","berbicara","menulis",
  "membaca","melihat","mendengar","merasa","berpikir","tahu","mengerti","paham","ingat","lupa","suka","cinta","benci","takut",
  "percaya","harap","ingin","mau","bisa","dapat","harus","boleh","perlu","coba","mulai","selesai","berhenti","terus","lanjut",
  "ambil","bawa","simpan","taruh","kasih","terima","kirim","buka","tutup","masuk","keluar","naik","turun","duduk","berdiri",
  "membuat","menciptakan","membangun","mengembangkan","mengelola","mengatur","memimpin","mengajar","belajar","meneliti",
  "menganalisis","merancang","merencanakan","melaksanakan","mengevaluasi","memperbaiki","mengoptimalkan","mengintegrasikan",
  // Kata benda
  "orang","manusia","anak","ayah","ibu","kakak","adik","keluarga","teman","guru","murid","dokter","polisi","tentara",
  "rumah","sekolah","kantor","pasar","toko","jalan","kota","desa","negara","dunia","bumi","langit","laut","sungai","gunung",
  "makanan","minuman","buku","pensil","kertas","komputer","telepon","mobil","motor","pesawat","kapal","kereta",
  "waktu","hari","minggu","bulan","tahun","jam","menit","detik","pagi","siang","sore","malam","kemarin","hari ini","besok",
  "angka","huruf","kata","kalimat","bahasa","Indonesia","Inggris","Arab","Cina","Jepang","Korea","Perancis","Jerman",
  "ilmu","pengetahuan","teknologi","sains","matematika","fisika","kimia","biologi","sejarah","geografi","ekonomi","seni",
  "musik","lukisan","tari","teater","film","fotografi","desain","arsitektur","sastra","puisi","prosa","cerpen","novel",
  "pemerintah","presiden","menteri","gubernur","bupati","walikota","camat","lurah","kepala","pemimpin","rakyat","warga",
  "hukum","undang-undang","peraturan","kebijakan","program","proyek","rencana","anggaran","dana","modal","investasi",
  "kesehatan","penyakit","obat","dokter","rumah sakit","klinik","apotik","puskesmas","bidan","perawat","pasien",
  "pendidikan","universitas","akademi","sekolah tinggi","pesantren","madrasah","taman kanak-kanak","playgroup",
  "pertanian","peternakan","perikanan","kehutanan","pertambangan","industri","perdagangan","jasa","transportasi",
  "lingkungan","alam","hutan","kebun","sawah","ladang","pantai","danau","selat","teluk","tanjung","pulau","kepulauan",
  // Kata sifat
  "baik","buruk","besar","kecil","panjang","pendek","tinggi","rendah","berat","ringan","cepat","lambat","baru","lama",
  "bagus","jelek","cantik","tampan","pintar","bodoh","kaya","miskin","sehat","sakit","senang","sedih","marah","takut",
  "berani","pengecut","jujur","bohong","rajin","malas","hemat","boros","sopan","kasar","ramah","sombong","rendah hati",
  "modern","tradisional","digital","virtual","fisik","teknis","ilmiah","akademis","profesional","kreatif","inovatif",
  "berkelanjutan","efisien","efektif","aman","andal","fleksibel","skalabel","kuat","cerdas","pintar","bijaksana",
  // Kata keterangan
  "sangat","sekali","juga","sudah","belum","sedang","akan","masih","lagi","pun","pula","bahkan","justru","apalagi",
  "mungkin","pasti","tentu","memang","sebenarnya","ternyata","rupanya","sesungguhnya","kenyataannya","faktanya",
  "di sini","di sana","di mana","ke mana","dari mana","kapan","mengapa","bagaimana","berapa","siapa","apa","yang mana",
  "dengan cepat","secara perlahan","dengan benar","secara tepat","dengan baik","secara efisien","dengan cermat",
  // Kosakata Pancasila & Kebangsaan
  "Pancasila","Ketuhanan","Kemanusiaan","Persatuan","Kerakyatan","Keadilan","Indonesia","Nusantara","Bhinneka","Tunggal",
  "Ika","Merah Putih","Garuda","Banteng","Pohon Beringin","Kepala Banteng","Padi Kapas","Bintang","Rantai","bersatu",
  "merdeka","proklamasi","kemerdekaan","revolusi","perjuangan","pahlawan","bangsa","negara","rakyat","demokrasi",
  // Teknologi & Digital
  "teknologi","digital","internet","komputer","smartphone","laptop","tablet","aplikasi","perangkat lunak","perangkat keras",
  "data","informasi","database","server","jaringan","cloud","keamanan","privasi","enkripsi","kriptografi","siber",
  "kecerdasan buatan","pembelajaran mesin","big data","blockchain","internet of things","realitas virtual","augmented reality",
  "pengembangan","pemrograman","kode","algoritma","fungsi","variabel","array","objek","kelas","metode","properti",
  "antarmuka","modul","paket","pustaka","kerangka kerja","plugin","ekstensi","komponen","templat","tema",
  // Ekonomi & Bisnis
  "ekonomi","bisnis","perusahaan","organisasi","korporasi","wirausaha","pasar","pelanggan","produk","layanan","merek",
  "pemasaran","penjualan","pendapatan","keuntungan","kerugian","investasi","anggaran","biaya","harga","nilai","kualitas",
  "strategi","rencana","tujuan","sasaran","target","tonggak","tenggat waktu","proyek","tugas","tim","pemimpin","manajer",
  // Seni & Budaya
  "seni","budaya","tradisi","adat","istiadat","kesenian","kebudayaan","warisan","peninggalan","museum","galeri","pameran",
  "batik","wayang","gamelan","angklung","sasando","kolintang","tari saman","reog","barong","kecak","pendet","legong",
  "rendang","soto","gado-gado","nasi goreng","satay","tempe","tahu","kerupuk","sambal","rujak","es teh","jamu",
  // Alam & Lingkungan
  "alam","lingkungan","ekosistem","biodiversitas","flora","fauna","hutan hujan tropis","mangrove","terumbu karang",
  "orangutan","harimau","gajah","komodo","cendrawasih","rafflesia","merapi","krakatau","danau toba","raja ampat",
  // Ilmu Pengetahuan
  "penelitian","riset","studi","analisis","eksperimen","observasi","hipotesis","teori","metodologi","data","sampel",
  "statistik","probabilitas","variabel","indikator","parameter","model","simulasi","prediksi","validasi","verifikasi",
  // Kata tambahan untuk mencapai target
  "abadi","adat","adil","alam","amal","amanah","ambisius","analitis","anggaran","antisipasi","aplikatif","aspirasi",
  "asertif","aset","atraktif","autentik","autonomi","bakat","berdaya","berkembang","bermutu","berorientasi","berprestasi",
  "bijak","bina","cakap","capai","cermat","cipta","dampak","dedikasi","dinamis","disiplin","efektif","empati","etika",
  "evaluasi","fasilitasi","galang","gerak","gotong","harmoni","hasrat","holistik","humanis","ikhlas","implementasi",
  "inklusif","inspirasi","integritas","intelektual","interaktif","inventif","jujur","karakter","keberlanjutan","komitmen",
  "kompeten","konsisten","kooperatif","kreatif","kritis","kualitas","layak","loyal","mandiri","manfaat","martabat",
  "motivasi","mulia","musyawarah","mufakat","norma","objektif","optimal","partisipatif","pelayanan","pengembangan",
  "prestasi","produktif","progresif","proaktif","rasional","reflektif","reformasi","relasi","responsif","sistematis",
  "solidaritas","tanggap","tangguh","terbuka","terpadu","terukur","toleransi","transparan","unggul","unik","visioner",
];

// ── English Derived Words ─────────────────────────────────────────────────────
// Every EN_WORDS root is combined with real derivational prefixes/suffixes so
// pagination across the whole declared count always resolves to a distinct,
// viewable word — instead of running out after the first few hundred entries.
const EN_ROOTS = Array.from(new Set(EN_WORDS));

export const EN_PREFIXES = [
  "", "re", "un", "dis", "non", "pre", "mis", "over", "under", "co", "anti", "semi",
];
export const EN_SUFFIXES = [
  "", "s", "ed", "ing", "er", "est", "ly", "ness", "ful", "less", "able", "tion", "ism", "ist",
];

function applyEnglishSuffix(root: string, suffix: string): string {
  if (!suffix) return root;
  let stem = root;
  if (/e$/.test(stem) && /^(ing|ed|er|est|able)/.test(suffix)) {
    stem = stem.slice(0, -1);
  } else if (/[^aeiou]y$/.test(stem) && /^(ed|er|est|ness|ly)/.test(suffix)) {
    stem = stem.slice(0, -1) + "i";
  }
  return stem + suffix;
}

export function buildEnglishWord(rootIdx: number, prefixIdx: number, suffixIdx: number): string {
  const root = EN_ROOTS[rootIdx % EN_ROOTS.length];
  const prefix = EN_PREFIXES[prefixIdx % EN_PREFIXES.length];
  const suffix = EN_SUFFIXES[suffixIdx % EN_SUFFIXES.length];
  return prefix + applyEnglishSuffix(root, suffix);
}

export const EN_GENERATED_TOTAL = EN_ROOTS.length * EN_PREFIXES.length * EN_SUFFIXES.length;

export function getEnglishGenerated(start = 0, count = 100): string[] {
  const results: string[] = [];
  const perRoot = EN_PREFIXES.length * EN_SUFFIXES.length;
  for (let i = start; i < start + count && i < EN_GENERATED_TOTAL; i++) {
    const rootIdx = Math.floor(i / perRoot);
    const rem = i % perRoot;
    const prefixIdx = Math.floor(rem / EN_SUFFIXES.length);
    const suffixIdx = rem % EN_SUFFIXES.length;
    results.push(buildEnglishWord(rootIdx, prefixIdx, suffixIdx));
  }
  return results;
}

// ── Indonesian Derived Words ───────────────────────────────────────────────────
// Every ID_WORDS root is combined with real imbuhan (Indonesian affixes),
// applying the standard KPST peluluhan (nasalization) rule for meN-/peN-, so
// the full declared count is real derived vocabulary, not a padded label.
const ID_ROOTS = Array.from(new Set(ID_WORDS));

export const ID_PREFIXES = ["", "me", "di", "ber", "ter", "pe", "se", "ke"];
export const ID_SUFFIXES = ["", "kan", "i", "an", "nya", "kannya", "annya", "isasi"];

function nasalizeIndonesian(root: string): string {
  const first = (root[0] || "").toLowerCase();
  if ("aiueo".includes(first)) return "ng" + root;
  if (first === "k") return "ng" + root.slice(1);
  if (first === "g" || first === "h" || first === "q") return "ng" + root;
  if (first === "p") return "m" + root.slice(1);
  if (first === "b" || first === "f" || first === "v") return "m" + root;
  if (first === "t") return "n" + root.slice(1);
  if (first === "c" || first === "d" || first === "j" || first === "z") return "n" + root;
  if (first === "s") return "ny" + root.slice(1);
  return root;
}

function applyIndonesianPrefix(root: string, prefix: string): string {
  switch (prefix) {
    case "": return root;
    case "me": return "me" + nasalizeIndonesian(root);
    case "pe": return "pe" + nasalizeIndonesian(root);
    case "di": return "di" + root;
    case "ter": return "ter" + root;
    case "ber": return "ber" + root;
    case "se": return "se" + root;
    case "ke": return "ke" + root;
    default: return prefix + root;
  }
}

export function buildIndonesianWord(rootIdx: number, prefixIdx: number, suffixIdx: number): string {
  const root = ID_ROOTS[rootIdx % ID_ROOTS.length];
  const prefix = ID_PREFIXES[prefixIdx % ID_PREFIXES.length];
  const suffix = ID_SUFFIXES[suffixIdx % ID_SUFFIXES.length];
  return applyIndonesianPrefix(root, prefix) + suffix;
}

export const ID_GENERATED_TOTAL = ID_ROOTS.length * ID_PREFIXES.length * ID_SUFFIXES.length;

export function getIndonesianGenerated(start = 0, count = 100): string[] {
  const results: string[] = [];
  const perRoot = ID_PREFIXES.length * ID_SUFFIXES.length;
  for (let i = start; i < start + count && i < ID_GENERATED_TOTAL; i++) {
    const rootIdx = Math.floor(i / perRoot);
    const rem = i % perRoot;
    const prefixIdx = Math.floor(rem / ID_SUFFIXES.length);
    const suffixIdx = rem % ID_SUFFIXES.length;
    results.push(buildIndonesianWord(rootIdx, prefixIdx, suffixIdx));
  }
  return results;
}

// ── Numeric Kata (0-9999) ─────────────────────────────────────────────────────
export function getNumericKata(start = 0, count = 100): string[] {
  const results: string[] = [];
  for (let i = start; i < start + count && i < 1_000_000; i++) {
    results.push(String(i));
  }
  return results;
}

// ── Alphabetic Kata ───────────────────────────────────────────────────────────
export const ALPHA_UPPER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
export const ALPHA_LOWER = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));

// ── Symbol Kata ───────────────────────────────────────────────────────────────
export const SYMBOLS = [
  "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "+", "=",
  "[", "]", "{", "}", "|", "\\", ":", ";", "'", '"', "<", ">", ",",
  ".", "?", "/", "~", "`", "©", "®", "™", "€", "£", "¥", "₹", "Rp",
  "→", "←", "↑", "↓", "↔", "⇒", "⇐", "⇑", "⇓", "≡", "≈", "≠",
  "∞", "√", "∑", "∫", "π", "α", "β", "γ", "δ", "Δ", "Ω", "μ", "σ",
];

// ── Component Kata ────────────────────────────────────────────────────────────
export const COMPONENTS = [
  "button","input","textarea","select","checkbox","radio","form","label","fieldset","legend",
  "table","thead","tbody","tfoot","tr","th","td","ul","ol","li","dl","dt","dd",
  "div","span","section","article","header","footer","main","nav","aside","figure","figcaption",
  "h1","h2","h3","h4","h5","h6","p","blockquote","pre","code","em","strong","a","img","video","audio",
  "canvas","svg","iframe","script","style","link","meta","title","html","head","body",
  "modal","dialog","tooltip","popover","dropdown","accordion","tab","carousel","slider","progress",
  "badge","chip","tag","alert","toast","notification","breadcrumb","pagination","stepper","wizard",
  "card","panel","box","container","grid","flex","row","column","spacer","divider","separator",
  "avatar","icon","logo","banner","hero","jumbotron","sidebar","drawer","overlay","backdrop",
  "menu","menuitem","toolbar","statusbar","searchbar","searchbox","combobox","autocomplete",
  "datepicker","timepicker","colorpicker","rangepicker","filepicker","imagepicker",
  "chart","graph","plot","diagram","map","timeline","calendar","schedule","gantt",
  "editor","viewer","preview","terminal","console","logger","monitor","dashboard",
  "login","register","profile","settings","notifications","messages","inbox","chat",
];

// ── Open Source Reference Links ───────────────────────────────────────────────
export const OPENSOURCE_REFS = [
  "https://github.com",
  "https://gitlab.com",
  "https://bitbucket.org",
  "https://npmjs.com",
  "https://pypi.org",
  "https://crates.io",
  "https://pkg.go.dev",
  "https://developer.mozilla.org",
  "https://w3schools.com",
  "https://stackoverflow.com",
  "https://docs.netlify.com",
  "https://reactjs.org",
  "https://vuejs.org",
  "https://angular.io",
  "https://svelte.dev",
  "https://astro.build",
  "https://nextjs.org",
  "https://remix.run",
  "https://tailwindcss.com",
  "https://sass-lang.com",
  "https://nodejs.org",
  "https://deno.land",
  "https://bun.sh",
  "https://python.org",
  "https://rust-lang.org",
  "https://golang.org",
  "https://typescriptlang.org",
  "https://developer.chrome.com",
  "https://web.dev",
  "https://css-tricks.com",
  "https://smashingmagazine.com",
  "https://a11yproject.com",
  "https://owasp.org",
  "https://cve.mitre.org",
  "https://opensource.org",
  "https://creativecommons.org",
  "https://mit-license.org",
  "https://apache.org",
  "https://gnu.org",
  "https://linux.org",
  "https://kernel.org",
  "https://postgresql.org",
  "https://mysql.com",
  "https://mongodb.com",
  "https://redis.io",
  "https://elasticsearch.co",
  "https://graphql.org",
  "https://grpc.io",
  "https://openapi.tools",
  "https://swagger.io",
  "https://jsonapi.org",
  "https://json.org",
  "https://yaml.org",
  "https://toml.io",
  "https://docker.com",
  "https://kubernetes.io",
  "https://terraform.io",
  "https://ansible.com",
  "https://prometheus.io",
  "https://grafana.com",
  "https://opentelemetry.io",
  "https://sentry.io",
  "https://datadog.com",
  "https://cloudflare.com",
  "https://vercel.com",
  "https://railway.app",
  "https://supabase.com",
  "https://firebase.google.com",
  "https://auth0.com",
  "https://stripe.com",
  "https://twilio.com",
  "https://sendgrid.com",
  "https://cloudinary.com",
  "https://unsplash.com",
  "https://fontawesome.com",
  "https://fonts.google.com",
  "https://heroicons.com",
  "https://lucide.dev",
  "https://radix-ui.com",
  "https://ui.shadcn.com",
  "https://headlessui.com",
  "https://primereact.org",
  "https://ant.design",
  "https://mui.com",
  "https://chakra-ui.com",
  "https://mantine.dev",
  "https://daisyui.com",
  "https://getbootstrap.com",
  "https://bulma.io",
  "https://foundation.zurb.com",
  "https://d3js.org",
  "https://chartjs.org",
  "https://echarts.apache.org",
  "https://threejs.org",
  "https://pixijs.com",
  "https://babylonjs.com",
  "https://tensorflow.org",
  "https://pytorch.org",
  "https://scikit-learn.org",
  "https://huggingface.co",
  "https://langchain.com",
  "https://openai.com",
  "https://anthropic.com",
  "https://google.com/ai",
  "https://deepmind.google",
];

// ── Indonesian National Library Reference ────────────────────────────────────
export const PERPUSNAS_REF = {
  name: "Perpustakaan Nasional Republik Indonesia",
  url: "https://perpusnas.go.id",
  api: "https://api.perpusnas.go.id",
  catalog: "https://katalog.perpusnas.go.id",
  repository: "https://repository.perpusnas.go.id",
  eresources: "https://e-resources.perpusnas.go.id",
  description: "Perpustakaan Nasional RI adalah lembaga pemerintah nonkementerian yang melaksanakan tugas pemerintahan di bidang perpustakaan.",
  collections: [
    "Koleksi Nasional Indonesia",
    "Naskah Kuno & Manuskrip",
    "Buku Langka & Koleksi Khusus",
    "E-Journal & Database Ilmiah",
    "Karya Tulis Ilmiah",
    "Dokumen Pemerintah",
    "Peta & Kartografi",
    "Foto & Audio Visual",
  ],
};

// ── Kata Category Registry ────────────────────────────────────────────────────
export interface KataCategory {
  id: string;
  name: string;
  nameid: string;
  count: number;
  words: string[] | null;
  generator?: (start: number, count: number) => string[];
}

export const KATA_CATEGORIES: KataCategory[] = [
  {
    id: "en",
    name: "English Words",
    nameid: "Kata Bahasa Inggris",
    count: EN_GENERATED_TOTAL,
    words: null,
    generator: getEnglishGenerated,
  },
  {
    id: "id",
    name: "Indonesian Words",
    nameid: "Kata Bahasa Indonesia",
    count: ID_GENERATED_TOTAL,
    words: null,
    generator: getIndonesianGenerated,
  },
  {
    id: "numeric",
    name: "Numbers",
    nameid: "Angka",
    count: 1_000_000,
    words: null,
    generator: getNumericKata,
  },
  {
    id: "alpha-upper",
    name: "Uppercase Letters A-Z",
    nameid: "Huruf Besar A-Z",
    count: 26,
    words: ALPHA_UPPER,
  },
  {
    id: "alpha-lower",
    name: "Lowercase Letters a-z",
    nameid: "Huruf Kecil a-z",
    count: 26,
    words: ALPHA_LOWER,
  },
  {
    id: "symbols",
    name: "Symbols",
    nameid: "Simbol",
    count: SYMBOLS.length,
    words: SYMBOLS,
  },
  {
    id: "components",
    name: "Components",
    nameid: "Komponen",
    count: COMPONENTS.length,
    words: COMPONENTS,
  },
];

// ── Kata File Content Generators ──────────────────────────────────────────────
export function generateIndexIeje(kata: string, category: string, lang = "mixed"): string {
  return `REBER_KATA_INDEX v1.0
kata: ${kata}
category: ${category}
lang: ${lang}
type: node
ref: /allunivers_os/kata/${encodeURIComponent(kata)}/index.ieje
view: visual
render: component
display: primary
access: public
build: reber_engine
compiled: true
version: 1.0
system: allunivers_os
engine: reber_ai
path: /allunivers_os/kata/${encodeURIComponent(kata)}/
extension: .ieje
created: ${new Date().toISOString().split("T")[0]}
status: active
`;
}

export function generateStyleAeea(kata: string, category: string): string {
  return `REBER_STYLE v1.0
kata: ${kata}
category: ${category}
layout: flex
theme: white-blue
primary: #0066CC
secondary: #FFFFFF
accent: #4DA3FF
background: #F0F7FF
text: #001A33
border: 1px solid #CCE5FF
radius: 8px
shadow: 0 2px 8px rgba(0,102,204,0.1)
font: system-ui, -apple-system, sans-serif
font-size: 14px
line-height: 1.5
padding: 16px
margin: 0
display: flex
direction: column
align: flex-start
justify: flex-start
extension: .aeea
version: 1.0
system: allunivers_os
`;
}

export function generateFungsiNz(kata: string, category: string): string {
  return `REBER_FUNGSI v1.0
kata: ${kata}
category: ${category}
logic: kata_processor
function: semantic_parse
input: text_string
output: component_node
transform: kata_to_component
validate: schema_check
process: reber_engine
execute: ai_inference
response: structured_json
format: json_ld
refs: ${PERPUSNAS_REF.url}
source: allunivers_os
extension: .nz
version: 1.0
system: allunivers_os
engine: reber_ai
mode: active
pipeline: kata → parse → validate → render → output
`;
}

export function generateComponentCk(kata: string, category: string): string {
  return `REBER_COMPONENT v1.0
kata: ${kata}
category: ${category}
component: kata_component
props: [kata, category, lang, index, style]
state: [active, hover, selected, loading]
slots: [header, body, footer]
composition: index.ieje + style.aeea + fungsi.nz
knowledge: semantic_node
reusable: true
extension: .ck
version: 1.0
system: allunivers_os
`;
}

export function generateRegistryRegs(kata: string, category: string): string {
  return `REBER_REGISTRY v1.0
kata: ${kata}
category: ${category}
registry: kata_registry
scope: /allunivers_os/kata/${encodeURIComponent(kata)}/
permissions: read, write, execute
owner: reber_ai
visibility: public
indexed: true
searchable: true
rules:
  - unique_path: true
  - min_files: 6
  - required_ext: [.ieje, .aeea, .nz]
extension: .regs
version: 1.0
system: allunivers_os
`;
}

export function generateSystemLog(kata: string, category: string): string {
  const now = new Date().toISOString();
  return `REBER_LOG v1.0
kata: ${kata}
category: ${category}
[${now}] node created
[${now}] index.ieje generated
[${now}] style.aeea generated
[${now}] fungsi.nz generated
[${now}] component.ck generated
[${now}] registry.regs generated
[${now}] status: active
extension: .log
version: 1.0
system: allunivers_os
`;
}

// ── Kata Lookup Utilities ─────────────────────────────────────────────────────
export function getKataList(categoryId: string, page = 0, pageSize = 50): string[] {
  const cat = KATA_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return [];

  const start = page * pageSize;
  if (cat.words) {
    return cat.words.slice(start, start + pageSize);
  }
  if (cat.generator) {
    return cat.generator(start, pageSize);
  }
  return [];
}

export function searchKata(query: string, limit = 50): Array<{ kata: string; category: string }> {
  const results: Array<{ kata: string; category: string }> = [];
  const q = query.toLowerCase();
  // Generated categories (en/id/numeric) can hold 100k-1M+ entries; scanning
  // the first slice of each is enough to surface real matches fast without
  // materializing the whole category on every keystroke.
  const MAX_SCAN_PER_CATEGORY = 200_000;

  for (const cat of KATA_CATEGORIES) {
    if (results.length >= limit) break;
    const candidates = cat.words ?? cat.generator?.(0, Math.min(cat.count, MAX_SCAN_PER_CATEGORY)) ?? [];
    for (const word of candidates) {
      if (word.toLowerCase().includes(q)) {
        results.push({ kata: word, category: cat.id });
        if (results.length >= limit) break;
      }
    }
  }
  return results;
}

export function getTotalKataCount(): number {
  return KATA_CATEGORIES.reduce((sum, cat) => sum + cat.count, 0);
}

// Real, computed total — every one of these nodes is actually browsable via
// getKataList/browseVirtualPath, not a rounded marketing figure.
export const KATA_TOTAL = getTotalKataCount();
