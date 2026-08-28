// Conținutul paginilor legale (Termeni + Confidențialitate), structurat și bilingv.
//
// ⚠️ DE COMPLETAT ÎNAINTE DE PUBLICARE: valorile din LEGAL_CONFIG marcate cu „[...]".
// Sunt singurul loc de editat — se propagă automat în ambele documente și ambele limbi.

export const LEGAL_CONFIG = {
  numeSite: "Recrutare Directă",
  domeniu: "recrutaridirecte.ro",
  denumireFirma: "SOFT CRUTING",
  formaJuridica: "S.R.L.",
  cui: "55454004",
  nrRegCom: "J2026050632000",
  sediu: "Sat Ghiroda, Comuna Ghiroda, jud. Timiș, Str. Soarelui nr. 5, camera 1",
  emailContact: "iriluo85@gmail.com",
  emailGdpr: "iriluo85@gmail.com",
  telefon: "0771 732 148",
  platitorTva: false, // firmă neplătitoare de TVA → prețuri fără TVA
  procesatorPlati: "Netopia",
  varstaMinima: "16 ani",
  perioadaRetentie: "24 de luni",
  dataActualizarii: "26.08.2026",
};

const C = LEGAL_CONFIG;

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "sub"; text: string }
  | { kind: "box"; variant: "info" | "key"; text: string }
  | { kind: "table"; head: [string, string]; rows: [string, string][] }
  | { kind: "link"; text: string; href: string };

export type LegalSection = { title: string; blocks: LegalBlock[] };

export type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  footer: string;
};

const firma = `${C.denumireFirma} ${C.formaJuridica}`;

// ————————————————————————————————————————————————————————————————
// TERMENI ȘI CONDIȚII
// ————————————————————————————————————————————————————————————————

const termeniRo: LegalDoc = {
  title: "Termeni și condiții",
  updated: `Ultima actualizare: ${C.dataActualizarii}`,
  intro: `Bine ai venit pe ${C.numeSite}. Prin crearea unui cont sau prin utilizarea platformei disponibile la ${C.domeniu}, ești de acord cu acești termeni. Te rugăm să îi citești cu atenție.`,
  sections: [
    {
      title: "1. Cine administrează platforma",
      blocks: [
        {
          kind: "p",
          text: `Platforma ${C.numeSite} este administrată de ${firma}, cu sediul în ${C.sediu}, înregistrată la Registrul Comerțului sub nr. ${C.nrRegCom}, CUI ${C.cui}, email de contact: ${C.emailContact} (informații furnizate conform Legii nr. 365/2002 privind comerțul electronic).`,
        },
        {
          kind: "p",
          text: `Serviciile plătite (abonamentele) sunt comercializate și facturate direct de ${firma}. Aceasta vinde în nume propriu propriile servicii de abonament (nu servicii ale unor terți) și emite factura fiscală pentru fiecare plată.`,
        },
        {
          kind: "box",
          variant: "key",
          text: `Rolul companiei: în raport cu serviciile plătite, ${firma} acționează în calitate de COMERCIANT — vinde direct, în nume propriu, abonamentele oferite pe platformă și emite factura. Nu acționează ca marketplace, intermediar, distribuitor sau agent pentru servicii ale unor terți.`,
        },
      ],
    },
    {
      title: "2. Definiții",
      blocks: [
        {
          kind: "ul",
          items: [
            `Platforma – site-ul și serviciile oferite prin ${C.domeniu};`,
            "Utilizator – orice persoană care accesează sau folosește platforma;",
            "Candidat – utilizatorul care își creează un profil profesional și își publică CV-ul pentru a fi găsit de angajatori;",
            "Angajator – utilizatorul care caută candidați după criterii și îi contactează direct sau le trimite oferte;",
            "Conținut – orice text, date sau materiale (profil, CV, mesaje) încărcate de utilizatori.",
          ],
        },
      ],
    },
    {
      title: "3. Obiectul serviciului",
      blocks: [
        {
          kind: "p",
          text: `${C.numeSite} este o platformă online care le permite angajatorilor să caute direct candidați potriviți, după criterii, și să îi contacteze, iar candidaților să își publice profilul profesional și CV-ul pentru a fi găsiți — fără intermediari și fără anunțuri de tip job-board. Rezultatele căutării sunt ordonate automat printr-un scor de potrivire calculat pe baza criteriilor angajatorului.`,
        },
        {
          kind: "box",
          variant: "key",
          text: `Important: ${C.numeSite} are exclusiv rolul de a găzdui profilurile candidaților și de a facilita contactul dintre aceștia și angajatori. Nu suntem o agenție de recrutare, de plasare sau de mediere a forței de muncă și nu intermediem activ angajarea. Nu suntem parte în relația dintre angajator și candidat, nu verificăm și nu garantăm veridicitatea profilurilor, a CV-urilor sau a ofertelor și nu garantăm obținerea unui loc de muncă ori ocuparea unui post.`,
        },
      ],
    },
    {
      title: "4. Crearea și utilizarea contului",
      blocks: [
        {
          kind: "ul",
          items: [
            "Pentru a folosi anumite funcții trebuie să îți creezi un cont, furnizând date reale și actuale;",
            `Candidații trebuie să aibă cel puțin ${C.varstaMinima}; angajatorii trebuie să reprezinte legal o entitate care recrutează;`,
            "Ești responsabil pentru păstrarea confidențialității parolei și pentru toate activitățile din contul tău;",
            `Ne poți anunța imediat la ${C.emailContact} dacă suspectezi o utilizare neautorizată.`,
          ],
        },
      ],
    },
    {
      title: "5. Obligațiile angajatorilor",
      blocks: [
        {
          kind: "ul",
          items: [
            "să contacteze candidații doar pentru posturi reale, existente, conforme cu legislația muncii;",
            "să nu folosească criterii discriminatorii (vârstă, sex, etnie, religie, dizabilitate, orientare etc.);",
            "să nu solicite candidaților plăți pentru recrutare sau angajare prin intermediul platformei;",
            "să folosească datele candidaților (inclusiv CV-urile) exclusiv în scop de recrutare și cu respectarea GDPR.",
          ],
        },
      ],
    },
    {
      title: "6. Obligațiile candidaților",
      blocks: [
        {
          kind: "ul",
          items: [
            "să furnizeze informații corecte și care le aparțin;",
            "să nu încarce conținut fals, înșelător sau care aparține altcuiva.",
          ],
        },
      ],
    },
    {
      title: "7. Conținut interzis",
      blocks: [
        {
          kind: "p",
          text: "Este interzisă publicarea de conținut ilegal, discriminatoriu, fals, defăimător, care încalcă drepturi de proprietate intelectuală, conține malware, spam, scheme frauduloase („escrocherii”) sau care solicită taxe abuzive de la candidați. Ne rezervăm dreptul de a modera, suspenda sau șterge conținutul și conturile care încalcă acești termeni.",
        },
      ],
    },
    {
      title: "8. Proprietate intelectuală",
      blocks: [
        {
          kind: "p",
          text: `Platforma, denumirea, logo-ul, designul și software-ul aparțin ${C.denumireFirma} și sunt protejate legal. Prin publicarea de conținut, ne acorzi o licență neexclusivă de a-l afișa în cadrul serviciului. Rămâi titularul conținutului tău.`,
        },
      ],
    },
    {
      title: "9. Servicii plătite și plăți",
      blocks: [
        {
          kind: "p",
          text: "În prezent, platforma poate fi oferită gratuit (în perioada de test/beta). La introducerea funcțiilor plătite (de exemplu, profil de companie promovat, abonamente sau acces extins la baza de candidați):",
        },
        {
          kind: "ul",
          items: [
            "prețurile vor fi afișate clar, cu TVA inclus atunci când este cazul, înainte de plată;",
            `plata se va procesa prin ${C.procesatorPlati}, iar factura se emite conform legii;`,
            "condițiile specifice fiecărui serviciu plătit vor fi guvernate tot de acești termeni.",
          ],
        },
      ],
    },
    {
      title: "10. Dreptul de retragere (consumatori)",
      blocks: [
        {
          kind: "p",
          text: "Dacă ești consumator (persoană fizică) și achiziționezi un serviciu digital plătit, ai dreptul de a te retrage în termen de 14 zile, conform OUG nr. 34/2014. Excepție: dacă serviciul a fost prestat integral cu acordul tău expres prealabil și cu confirmarea că îți pierzi dreptul de retragere, acesta nu se mai aplică.",
        },
      ],
    },
    {
      title: "11. Limitarea răspunderii",
      blocks: [
        {
          kind: "p",
          text: "Platforma este oferită „ca atare”. Nu răspundem pentru conținutul profilurilor sau al CV-urilor, pentru deciziile de angajare, pentru relația dintre angajator și candidat, ori pentru eventuale prejudicii indirecte rezultate din utilizarea serviciului. Ne străduim să menținem platforma disponibilă, dar nu garantăm funcționarea neîntreruptă.",
        },
      ],
    },
    {
      title: "12. Durata și încetarea",
      blocks: [
        {
          kind: "p",
          text: "Îți poți șterge contul oricând, direct din pagina de Setări. Putem suspenda sau închide conturile care încalcă acești termeni sau legea, cu notificare atunci când este posibil.",
        },
      ],
    },
    {
      title: "13. Protecția datelor",
      blocks: [
        { kind: "p", text: "Prelucrarea datelor cu caracter personal este descrisă în Politica de confidențialitate, parte integrantă a acestor termeni." },
        { kind: "link", text: "Vezi Politica de confidențialitate", href: "/confidentialitate" },
      ],
    },
    {
      title: "14. Legea aplicabilă și soluționarea litigiilor",
      blocks: [
        {
          kind: "p",
          text: "Acești termeni sunt guvernați de legea română. Eventualele litigii se soluționează pe cale amiabilă; în caz contrar, sunt competente instanțele din România.",
        },
        {
          kind: "p",
          text: "Dacă ești consumator, te poți adresa și Autorității Naționale pentru Protecția Consumatorilor (ANPC) și mecanismului de Soluționare Alternativă a Litigiilor (SAL): www.anpc.ro, respectiv reclamatiisal.anpc.ro.",
        },
      ],
    },
    {
      title: "15. Modificarea termenilor",
      blocks: [
        {
          kind: "p",
          text: `Putem actualiza acești termeni. Versiunea în vigoare este publicată permanent pe ${C.domeniu}, cu data ultimei actualizări. Continuarea utilizării platformei după modificare înseamnă acceptarea noilor termeni.`,
        },
      ],
    },
  ],
  footer: `${firma} · ${C.sediu} · ${C.emailContact}. Document informativ, redactat ca model. Recomandăm revizuirea de către un avocat înainte de publicare.`,
};

const termeniEn: LegalDoc = {
  title: "Terms and Conditions",
  updated: `Last updated: ${C.dataActualizarii}`,
  intro: `Welcome to ${C.numeSite}. By creating an account or using the platform available at ${C.domeniu}, you agree to these terms. Please read them carefully.`,
  sections: [
    {
      title: "1. Who operates the platform",
      blocks: [
        {
          kind: "p",
          text: `The ${C.numeSite} platform is operated by ${firma}, headquartered at ${C.sediu}, registered with the Trade Register under no. ${C.nrRegCom}, tax ID ${C.cui}, contact email: ${C.emailContact} (information provided under Romanian Law no. 365/2002 on electronic commerce).`,
        },
        {
          kind: "p",
          text: `The paid services (subscriptions) are sold and invoiced directly by ${firma}. It sells its own subscription services in its own name (not third-party services) and issues a fiscal invoice for each payment.`,
        },
        {
          kind: "box",
          variant: "key",
          text: `Company role: with respect to the paid services, ${firma} acts as the MERCHANT — it sells the subscriptions offered on the platform directly and in its own name, and issues the invoice. It does not act as a marketplace, intermediary, distributor, or agent for third-party services.`,
        },
      ],
    },
    {
      title: "2. Definitions",
      blocks: [
        {
          kind: "ul",
          items: [
            `Platform – the website and services offered through ${C.domeniu};`,
            "User – any person who accesses or uses the platform;",
            "Candidate – the user who creates a professional profile and publishes their CV to be found by employers;",
            "Employer – the user who searches for candidates by criteria and contacts them directly or sends them offers;",
            "Content – any text, data or materials (profile, CV, messages) uploaded by users.",
          ],
        },
      ],
    },
    {
      title: "3. What the service does",
      blocks: [
        {
          kind: "p",
          text: `${C.numeSite} is an online platform that lets employers search directly for suitable candidates by criteria and contact them, and lets candidates publish their professional profile and CV to be found — with no middlemen and no job-board listings. Search results are ranked automatically by a match score computed from the employer's criteria.`,
        },
        {
          kind: "box",
          variant: "key",
          text: `Important: ${C.numeSite} only hosts candidate profiles and facilitates contact between candidates and employers. We are not a recruitment, placement or labour-brokerage agency and we do not actively broker employment. We are not a party to the relationship between employer and candidate, we do not verify or guarantee the accuracy of profiles, CVs or offers, and we do not guarantee obtaining a job or filling a position.`,
        },
      ],
    },
    {
      title: "4. Creating and using your account",
      blocks: [
        {
          kind: "ul",
          items: [
            "To use certain features you must create an account, providing real and up-to-date information;",
            `Candidates must be at least ${C.varstaMinima.replace("ani", "years old")}; employers must legally represent an entity that recruits;`,
            "You are responsible for keeping your password confidential and for all activity in your account;",
            `Notify us immediately at ${C.emailContact} if you suspect unauthorized use.`,
          ],
        },
      ],
    },
    {
      title: "5. Employers' obligations",
      blocks: [
        {
          kind: "ul",
          items: [
            "contact candidates only for real, existing positions that comply with labour law;",
            "do not use discriminatory criteria (age, sex, ethnicity, religion, disability, orientation, etc.);",
            "do not ask candidates for payments for recruitment or hiring through the platform;",
            "use candidates' data (including CVs) solely for recruitment purposes and in compliance with GDPR.",
          ],
        },
      ],
    },
    {
      title: "6. Candidates' obligations",
      blocks: [
        {
          kind: "ul",
          items: [
            "provide accurate information that belongs to you;",
            "do not upload false, misleading content, or content that belongs to someone else.",
          ],
        },
      ],
    },
    {
      title: "7. Prohibited content",
      blocks: [
        {
          kind: "p",
          text: "It is forbidden to publish content that is illegal, discriminatory, false, defamatory, that infringes intellectual property rights, contains malware, spam, fraudulent schemes (\"scams\"), or that demands abusive fees from candidates. We reserve the right to moderate, suspend or delete content and accounts that breach these terms.",
        },
      ],
    },
    {
      title: "8. Intellectual property",
      blocks: [
        {
          kind: "p",
          text: `The platform, its name, logo, design and software belong to ${C.denumireFirma} and are legally protected. By publishing content, you grant us a non-exclusive license to display it within the service. You remain the owner of your content.`,
        },
      ],
    },
    {
      title: "9. Paid services and payments",
      blocks: [
        {
          kind: "p",
          text: "Currently, the platform may be offered for free (during the test/beta period). When paid features are introduced (for example, a promoted company profile, subscriptions, or extended access to the candidate base):",
        },
        {
          kind: "ul",
          items: [
            "prices will be shown clearly, with VAT included where applicable, before payment;",
            `payment will be processed through ${C.procesatorPlati}, and the invoice is issued as required by law;`,
            "the specific terms of each paid service will also be governed by these terms.",
          ],
        },
      ],
    },
    {
      title: "10. Right of withdrawal (consumers)",
      blocks: [
        {
          kind: "p",
          text: "If you are a consumer (natural person) and purchase a paid digital service, you have the right to withdraw within 14 days, under Romanian Emergency Ordinance no. 34/2014. Exception: if the service was fully performed with your prior express consent and your acknowledgement that you lose the right of withdrawal, it no longer applies.",
        },
      ],
    },
    {
      title: "11. Limitation of liability",
      blocks: [
        {
          kind: "p",
          text: "The platform is provided \"as is\". We are not liable for the content of profiles or CVs, for hiring decisions, for the relationship between employer and candidate, or for any indirect damages arising from use of the service. We strive to keep the platform available but do not guarantee uninterrupted operation.",
        },
      ],
    },
    {
      title: "12. Duration and termination",
      blocks: [
        {
          kind: "p",
          text: "You can delete your account anytime, directly from the Settings page. We may suspend or close accounts that breach these terms or the law, with notice where possible.",
        },
      ],
    },
    {
      title: "13. Data protection",
      blocks: [
        { kind: "p", text: "The processing of personal data is described in the Privacy Policy, an integral part of these terms." },
        { kind: "link", text: "See the Privacy Policy", href: "/confidentialitate" },
      ],
    },
    {
      title: "14. Governing law and dispute resolution",
      blocks: [
        {
          kind: "p",
          text: "These terms are governed by Romanian law. Any disputes are resolved amicably; otherwise, the courts of Romania have jurisdiction.",
        },
        {
          kind: "p",
          text: "If you are a consumer, you may also contact the National Authority for Consumer Protection (ANPC) and the Alternative Dispute Resolution mechanism (SAL): www.anpc.ro and reclamatiisal.anpc.ro.",
        },
      ],
    },
    {
      title: "15. Changes to the terms",
      blocks: [
        {
          kind: "p",
          text: `We may update these terms. The current version is published permanently at ${C.domeniu}, with the date of the last update. Continuing to use the platform after a change means accepting the new terms.`,
        },
      ],
    },
  ],
  footer: `${firma} · ${C.sediu} · ${C.emailContact}. Informational document, drafted as a template. We recommend review by a lawyer before publishing.`,
};

// ————————————————————————————————————————————————————————————————
// POLITICA DE CONFIDENȚIALITATE
// ————————————————————————————————————————————————————————————————

const confidRo: LegalDoc = {
  title: "Politica de confidențialitate",
  updated: `Ultima actualizare: ${C.dataActualizarii}`,
  intro: `${C.numeSite} respectă confidențialitatea datelor tale. Această politică explică ce date personale colectăm prin platforma disponibilă la ${C.domeniu}, în ce scopuri le folosim, cui le divulgăm și ce drepturi ai, în conformitate cu Regulamentul (UE) 2016/679 (GDPR).`,
  sections: [
    {
      title: "1. Cine suntem (operatorul de date)",
      blocks: [
        {
          kind: "p",
          text: `Operatorul datelor tale cu caracter personal este ${firma}, cu sediul în ${C.sediu}, înregistrată la Registrul Comerțului sub nr. ${C.nrRegCom}, cod unic de înregistrare ${C.cui} (denumită în continuare „noi”, „platforma” sau „${C.numeSite}”).`,
        },
        { kind: "p", text: `Pentru orice întrebare legată de datele tale personale ne poți contacta la: ${C.emailGdpr}.` },
      ],
    },
    {
      title: "2. Ce date personale colectăm",
      blocks: [
        { kind: "sub", text: "a) Date pe care ni le furnizezi direct — candidați" },
        {
          kind: "ul",
          items: [
            "date de identificare și contact: nume, prenume, adresă de email, număr de telefon, localitate/zonă;",
            "datele de autentificare ale contului (parola este stocată criptat) — sau, dacă alegi, autentificarea prin Google;",
            "conținutul CV-ului și al profilului: experiență profesională, studii, competențe, limbi străine, disponibilitate, așteptări salariale și orice alte informații pe care alegi să le incluzi;",
            "mesajele trimise prin platformă și răspunsurile la ofertele de angajare.",
          ],
        },
        { kind: "sub", text: "b) Date pe care ni le furnizezi direct — angajatori" },
        {
          kind: "ul",
          items: [
            "datele companiei (denumire, industrie, locație, mărime, website, descriere) și, la introducerea serviciilor plătite, datele de facturare;",
            "domeniile de interes și mesajele/ofertele trimise candidaților.",
          ],
        },
        { kind: "sub", text: "c) Date colectate automat" },
        {
          kind: "ul",
          items: [
            "informații tehnice minime (adresă IP, tip de dispozitiv și browser) și jurnale de acces, necesare pentru securitate și funcționare;",
            "evidența vizualizărilor: reținem când un angajator îți vizualizează profilul sau CV-ul, pentru a-ți arăta ție (candidatul) câți angajatori te-au văzut.",
          ],
        },
      ],
    },
    {
      title: "3. În ce scopuri și pe ce temei legal prelucrăm datele",
      blocks: [
        {
          kind: "table",
          head: ["Scopul prelucrării", "Temeiul legal (GDPR)"],
          rows: [
            ["Crearea și administrarea contului tău", "Executarea contractului – art. 6(1)(b)"],
            ["Publicarea profilului și a CV-ului candidatului și afișarea lor angajatorilor care caută pe platformă", "Executarea contractului – art. 6(1)(b)"],
            ["Calcularea automată a scorului de potrivire în funcție de criteriile angajatorului", "Executarea contractului / interes legitim – art. 6(1)(b) și (f)"],
            ["Mesageria și trimiterea/răspunsul la oferte de angajare", "Executarea contractului – art. 6(1)(b)"],
            ["Notificări și comunicări legate de serviciu (mesaje noi, oferte)", "Executarea contractului / interes legitim – art. 6(1)(b) și (f)"],
            ["Emailuri periodice cu CV-uri noi potrivite (digest) și alte comunicări de marketing", "Consimțământ – art. 6(1)(a)"],
            ["Securitate, prevenirea fraudei, îmbunătățirea platformei", "Interes legitim – art. 6(1)(f)"],
            ["Facturare și obligații contabile/fiscale (după introducerea plăților)", "Obligație legală – art. 6(1)(c)"],
          ],
        },
      ],
    },
    {
      title: "4. Cine are acces la datele tale",
      blocks: [
        { kind: "p", text: "Putem divulga datele către următoarele categorii de destinatari, strict în scopurile de mai sus:" },
        {
          kind: "ul",
          items: [
            "Angajatorii – profilul unui candidat (fără emailul contului) și CV-urile atașate sunt vizibile angajatorilor autentificați care caută pe platformă; astfel funcționează serviciul de căutare directă;",
            `Furnizori care ne susțin serviciul (persoane împuternicite): furnizorul de găzduire web, serviciul de trimitere emailuri, iar la introducerea plăților procesatorul de plăți ${C.procesatorPlati};`,
            "Autorități publice – doar atunci când legea ne obligă sau la o cerere legală.",
          ],
        },
        { kind: "box", variant: "info", text: "Nu vindem datele tale personale către terți și nu le folosim în alte scopuri decât cele descrise aici. Mesajele dintr-o conversație sunt vizibile doar celor doi participanți." },
      ],
    },
    {
      title: "5. Transferuri în afara Spațiului Economic European",
      blocks: [
        {
          kind: "p",
          text: "Dacă unii dintre furnizorii noștri prelucrează date în afara SEE, ne asigurăm că transferul are loc pe baza unei decizii de adecvare a Comisiei Europene sau a clauzelor contractuale standard aprobate de aceasta, cu garanții corespunzătoare.",
        },
      ],
    },
    {
      title: "6. Cât timp păstrăm datele",
      blocks: [
        {
          kind: "ul",
          items: [
            "Cont activ: pe toată durata existenței contului tău;",
            `Candidați inactivi: maximum ${C.perioadaRetentie} de la ultima activitate; ulterior îți solicităm reconfirmarea sau ștergem datele;`,
            "Documente financiar-contabile: conform termenelor legale (de regulă 10 ani);",
            "După ștergerea contului: ștergem datele asociate (profil, CV-uri, mesaje), cu excepția celor pe care legea ne obligă să le păstrăm.",
          ],
        },
      ],
    },
    {
      title: "7. Drepturile tale",
      blocks: [
        { kind: "p", text: "În calitate de persoană vizată, ai următoarele drepturi:" },
        {
          kind: "ul",
          items: [
            "dreptul de acces la datele tale;",
            "dreptul la rectificarea datelor inexacte;",
            "dreptul la ștergerea datelor („dreptul de a fi uitat”);",
            "dreptul la restricționarea prelucrării;",
            "dreptul la portabilitatea datelor;",
            "dreptul de a te opune prelucrării întemeiate pe interes legitim;",
            "dreptul de a-ți retrage oricând consimțământul, fără a afecta legalitatea prelucrării anterioare;",
            "dreptul de a nu fi supus unei decizii automate cu efecte semnificative.",
          ],
        },
        { kind: "box", variant: "info", text: "Direct din pagina de Setări îți poți descărca oricând o copie a datelor tale (export) sau îți poți șterge definitiv contul și datele asociate. Poți controla tot de acolo și preferințele de notificare (email, digest)." },
        { kind: "p", text: `Pentru orice altă cerere îți poți exercita drepturile printr-un email la ${C.emailGdpr}. Îți răspundem în cel mult 30 de zile.` },
      ],
    },
    {
      title: "8. Dreptul de a depune o plângere",
      blocks: [
        {
          kind: "p",
          text: "Dacă apreciezi că ți-au fost încălcate drepturile, te poți adresa Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP): B-dul G-ral Gheorghe Magheru nr. 28-30, Sector 1, București; email: anspdcp@dataprotection.ro; web: www.dataprotection.ro.",
        },
      ],
    },
    {
      title: "9. Securitatea datelor",
      blocks: [
        {
          kind: "p",
          text: "Aplicăm măsuri tehnice și organizatorice adecvate pentru a proteja datele împotriva accesului neautorizat, pierderii sau divulgării: criptarea parolelor și a conexiunilor (HTTPS), acces limitat pe bază de necesitate, copii de siguranță și monitorizarea sistemelor.",
        },
      ],
    },
    {
      title: "10. Cookie-uri",
      blocks: [
        {
          kind: "p",
          text: "Folosim doar cookie-uri și tehnologii de stocare strict necesare pentru funcționarea platformei: sesiunea de autentificare (ca să rămâi logat) și preferința de limbă. Preferința de temă (luminos/întunecat) e păstrată local în browserul tău. În acest moment nu folosim cookie-uri de marketing sau de urmărire de la terți.",
        },
      ],
    },
    {
      title: "11. Minori",
      blocks: [
        {
          kind: "p",
          text: `Platforma nu se adresează persoanelor sub ${C.varstaMinima} și nu colectăm cu bună știință datele acestora. Dacă un minor ne-a furnizat date, le ștergem la sesizare.`,
        },
      ],
    },
    {
      title: "12. Modificări ale acestei politici",
      blocks: [
        {
          kind: "p",
          text: `Putem actualiza această politică periodic. Versiunea în vigoare este publicată permanent pe ${C.domeniu}, cu data ultimei actualizări. Modificările importante îți vor fi comunicate.`,
        },
      ],
    },
  ],
  footer: `${firma} · ${C.sediu} · ${C.emailContact}. Document informativ, redactat ca model. Recomandăm revizuirea de către un avocat înainte de publicare.`,
};

const confidEn: LegalDoc = {
  title: "Privacy Policy",
  updated: `Last updated: ${C.dataActualizarii}`,
  intro: `${C.numeSite} respects the privacy of your data. This policy explains what personal data we collect through the platform available at ${C.domeniu}, for what purposes we use it, to whom we disclose it, and what rights you have, in accordance with Regulation (EU) 2016/679 (GDPR).`,
  sections: [
    {
      title: "1. Who we are (the data controller)",
      blocks: [
        {
          kind: "p",
          text: `The controller of your personal data is ${firma}, headquartered at ${C.sediu}, registered with the Trade Register under no. ${C.nrRegCom}, tax ID ${C.cui} (referred to below as "we", "the platform" or "${C.numeSite}").`,
        },
        { kind: "p", text: `For any question about your personal data you can contact us at: ${C.emailGdpr}.` },
      ],
    },
    {
      title: "2. What personal data we collect",
      blocks: [
        { kind: "sub", text: "a) Data you provide directly — candidates" },
        {
          kind: "ul",
          items: [
            "identification and contact data: first name, last name, email address, phone number, city/area;",
            "account authentication data (the password is stored encrypted) — or, if you choose, sign-in via Google;",
            "the content of your CV and profile: work experience, education, skills, languages, availability, salary expectations and any other information you choose to include;",
            "messages sent through the platform and responses to job offers.",
          ],
        },
        { kind: "sub", text: "b) Data you provide directly — employers" },
        {
          kind: "ul",
          items: [
            "company data (name, industry, location, size, website, description) and, once paid services are introduced, billing data;",
            "fields of interest and the messages/offers sent to candidates.",
          ],
        },
        { kind: "sub", text: "c) Data collected automatically" },
        {
          kind: "ul",
          items: [
            "minimal technical information (IP address, device and browser type) and access logs, needed for security and operation;",
            "view records: we record when an employer views your profile or CV, in order to show you (the candidate) how many employers have viewed you.",
          ],
        },
      ],
    },
    {
      title: "3. Purposes and legal basis for processing",
      blocks: [
        {
          kind: "table",
          head: ["Purpose of processing", "Legal basis (GDPR)"],
          rows: [
            ["Creating and managing your account", "Performance of a contract – art. 6(1)(b)"],
            ["Publishing the candidate's profile and CV and showing them to employers who search on the platform", "Performance of a contract – art. 6(1)(b)"],
            ["Automatically computing the match score based on the employer's criteria", "Performance of a contract / legitimate interest – art. 6(1)(b) and (f)"],
            ["Messaging and sending/responding to job offers", "Performance of a contract – art. 6(1)(b)"],
            ["Service-related notifications and communications (new messages, offers)", "Performance of a contract / legitimate interest – art. 6(1)(b) and (f)"],
            ["Periodic emails with new matching CVs (digest) and other marketing communications", "Consent – art. 6(1)(a)"],
            ["Security, fraud prevention, improving the platform", "Legitimate interest – art. 6(1)(f)"],
            ["Invoicing and accounting/tax obligations (once payments are introduced)", "Legal obligation – art. 6(1)(c)"],
          ],
        },
      ],
    },
    {
      title: "4. Who has access to your data",
      blocks: [
        { kind: "p", text: "We may disclose data to the following categories of recipients, strictly for the purposes above:" },
        {
          kind: "ul",
          items: [
            "Employers – a candidate's profile (without the account email) and attached CVs are visible to authenticated employers who search on the platform; this is how the direct-search service works;",
            `Providers that support our service (processors): the web hosting provider, the email delivery service, and once payments are introduced the payment processor ${C.procesatorPlati};`,
            "Public authorities – only when required by law or upon a lawful request.",
          ],
        },
        { kind: "box", variant: "info", text: "We do not sell your personal data to third parties and do not use it for purposes other than those described here. Messages in a conversation are visible only to the two participants." },
      ],
    },
    {
      title: "5. Transfers outside the European Economic Area",
      blocks: [
        {
          kind: "p",
          text: "If some of our providers process data outside the EEA, we ensure the transfer takes place on the basis of an adequacy decision of the European Commission or of the standard contractual clauses it has approved, with appropriate safeguards.",
        },
      ],
    },
    {
      title: "6. How long we keep the data",
      blocks: [
        {
          kind: "ul",
          items: [
            "Active account: for the entire duration of your account;",
            `Inactive candidates: at most ${C.perioadaRetentie.replace("de luni", "months")} from the last activity; afterwards we ask you to reconfirm or we delete the data;`,
            "Financial-accounting documents: as required by law (usually 10 years);",
            "After account deletion: we delete the associated data (profile, CVs, messages), except for what the law requires us to keep.",
          ],
        },
      ],
    },
    {
      title: "7. Your rights",
      blocks: [
        { kind: "p", text: "As a data subject, you have the following rights:" },
        {
          kind: "ul",
          items: [
            "the right of access to your data;",
            "the right to rectification of inaccurate data;",
            "the right to erasure (\"the right to be forgotten\");",
            "the right to restriction of processing;",
            "the right to data portability;",
            "the right to object to processing based on legitimate interest;",
            "the right to withdraw consent at any time, without affecting the lawfulness of prior processing;",
            "the right not to be subject to an automated decision with significant effects.",
          ],
        },
        { kind: "box", variant: "info", text: "Directly from the Settings page you can download a copy of your data (export) anytime, or permanently delete your account and associated data. You can also control your notification preferences (email, digest) from there." },
        { kind: "p", text: `For any other request you can exercise your rights by email at ${C.emailGdpr}. We respond within at most 30 days.` },
      ],
    },
    {
      title: "8. Right to lodge a complaint",
      blocks: [
        {
          kind: "p",
          text: "If you believe your rights have been infringed, you may contact the National Supervisory Authority for Personal Data Processing (ANSPDCP): B-dul G-ral Gheorghe Magheru no. 28-30, Sector 1, Bucharest; email: anspdcp@dataprotection.ro; web: www.dataprotection.ro.",
        },
      ],
    },
    {
      title: "9. Data security",
      blocks: [
        {
          kind: "p",
          text: "We apply appropriate technical and organizational measures to protect the data against unauthorized access, loss or disclosure: encryption of passwords and connections (HTTPS), need-to-know access, backups, and system monitoring.",
        },
      ],
    },
    {
      title: "10. Cookies",
      blocks: [
        {
          kind: "p",
          text: "We use only cookies and storage technologies that are strictly necessary for the platform to work: the authentication session (so you stay logged in) and the language preference. Your theme preference (light/dark) is kept locally in your browser. We currently do not use marketing or third-party tracking cookies.",
        },
      ],
    },
    {
      title: "11. Minors",
      blocks: [
        {
          kind: "p",
          text: `The platform is not aimed at people under ${C.varstaMinima.replace("ani", "years old")} and we do not knowingly collect their data. If a minor has provided us data, we delete it upon notice.`,
        },
      ],
    },
    {
      title: "12. Changes to this policy",
      blocks: [
        {
          kind: "p",
          text: `We may update this policy periodically. The current version is published permanently at ${C.domeniu}, with the date of the last update. Important changes will be communicated to you.`,
        },
      ],
    },
  ],
  footer: `${firma} · ${C.sediu} · ${C.emailContact}. Informational document, drafted as a template. We recommend review by a lawyer before publishing.`,
};

export function getTermeni(locale: string): LegalDoc {
  return locale === "en" ? termeniEn : termeniRo;
}

export function getConfidentialitate(locale: string): LegalDoc {
  return locale === "en" ? confidEn : confidRo;
}

// ————————————————————————————————————————————————————————————————
// LIVRARE (servicii digitale)
// ————————————————————————————————————————————————————————————————

const livrareRo: LegalDoc = {
  title: "Livrare",
  updated: `Ultima actualizare: ${C.dataActualizarii}`,
  intro: `${C.numeSite} oferă exclusiv servicii digitale (acces la platforma online și la funcțiile abonamentelor). Nu comercializăm și nu livrăm produse fizice, deci nu se aplică transport sau costuri de livrare.`,
  sections: [
    {
      title: "1. Modul de livrare",
      blocks: [
        {
          kind: "p",
          text: `Serviciile se livrează electronic, prin activarea accesului în contul tău de pe ${C.domeniu}. Nu există expediere fizică și nu se percep costuri de transport.`,
        },
      ],
    },
    {
      title: "2. Termenul de livrare",
      blocks: [
        {
          kind: "box",
          variant: "key",
          text: `Accesul la abonamentul plătit se activează automat și imediat după confirmarea plății (de regulă în câteva secunde, maximum câteva minute).`,
        },
        {
          kind: "p",
          text: `Factura fiscală se emite electronic și se trimite pe adresa de email asociată contului.`,
        },
      ],
    },
    {
      title: "3. Dacă accesul nu se activează",
      blocks: [
        {
          kind: "p",
          text: `Dacă în câteva minute de la plată accesul nu a fost activat, scrie-ne la ${C.emailContact} și rezolvăm rapid, fără costuri suplimentare.`,
        },
      ],
    },
  ],
  footer: `Pentru orice întrebare legată de livrare, ne poți contacta la ${C.emailContact}.`,
};

const livrareEn: LegalDoc = {
  title: "Delivery",
  updated: `Last updated: ${C.dataActualizarii}`,
  intro: `${C.numeSite} provides digital services only (access to the online platform and subscription features). We do not sell or ship physical products, so no shipping or delivery costs apply.`,
  sections: [
    {
      title: "1. Delivery method",
      blocks: [
        {
          kind: "p",
          text: `Services are delivered electronically, by activating access in your account on ${C.domeniu}. There is no physical shipping and no transport costs.`,
        },
      ],
    },
    {
      title: "2. Delivery time",
      blocks: [
        {
          kind: "box",
          variant: "key",
          text: `Access to a paid subscription is activated automatically and immediately after the payment is confirmed (usually within seconds, at most a few minutes).`,
        },
        {
          kind: "p",
          text: `The fiscal invoice is issued electronically and sent to the email address associated with the account.`,
        },
      ],
    },
    {
      title: "3. If access is not activated",
      blocks: [
        {
          kind: "p",
          text: `If access has not been activated within a few minutes of payment, write to us at ${C.emailContact} and we will resolve it quickly, at no extra cost.`,
        },
      ],
    },
  ],
  footer: `For any delivery-related questions, contact us at ${C.emailContact}.`,
};

// ————————————————————————————————————————————————————————————————
// RETUR ȘI ANULARE
// ————————————————————————————————————————————————————————————————

const returRo: LegalDoc = {
  title: "Retur și anulare",
  updated: `Ultima actualizare: ${C.dataActualizarii}`,
  intro: `Deoarece ${C.numeSite} oferă servicii digitale (abonamente), regulile de mai jos descriu anularea abonamentului, dreptul legal de retragere și modul de rambursare.`,
  sections: [
    {
      title: "1. Anularea abonamentului",
      blocks: [
        {
          kind: "p",
          text: `Îți poți anula abonamentul oricând, din pagina Abonamente sau din Setări. La anulare, abonamentul nu se mai reînnoiește automat, iar accesul rămâne activ până la finalul perioadei deja plătite.`,
        },
      ],
    },
    {
      title: "2. Dreptul de retragere (14 zile)",
      blocks: [
        {
          kind: "p",
          text: `Conform OUG nr. 34/2014, ai dreptul să te retragi din contractul încheiat la distanță în termen de 14 zile de la data achiziției, fără a fi nevoie să justifici decizia.`,
        },
        {
          kind: "box",
          variant: "info",
          text: `Excepție (servicii digitale): dacă ai solicitat expres începerea furnizării serviciului înainte de expirarea celor 14 zile și ai confirmat că îți pierzi dreptul de retragere pentru partea deja prestată, retragerea nu se mai aplică pentru acea parte, conform legii.`,
        },
      ],
    },
    {
      title: "3. Termenul și modul de rambursare",
      blocks: [
        {
          kind: "p",
          text: `Dacă retragerea este aplicabilă, îți rambursăm sumele în cel mult 14 zile de la data la care ne-ai comunicat decizia, folosind aceeași metodă de plată (card, procesat prin ${C.procesatorPlati}), fără costuri suplimentare pentru tine.`,
        },
      ],
    },
    {
      title: "4. Cum ceri anularea sau returul",
      blocks: [
        {
          kind: "ul",
          items: [
            `Anularea abonamentului: din pagina Abonamente sau din Setări → Abonament.`,
            `Cerere de retragere/rambursare: trimite un email la ${C.emailContact}, menționând datele contului. Îți răspundem în cel mult 2 zile lucrătoare.`,
          ],
        },
      ],
    },
  ],
  footer: `Pentru orice întrebare legată de retur sau anulare, ne poți contacta la ${C.emailContact}.`,
};

const returEn: LegalDoc = {
  title: "Returns & cancellation",
  updated: `Last updated: ${C.dataActualizarii}`,
  intro: `Because ${C.numeSite} provides digital services (subscriptions), the rules below describe subscription cancellation, the legal right of withdrawal, and how refunds work.`,
  sections: [
    {
      title: "1. Cancelling your subscription",
      blocks: [
        {
          kind: "p",
          text: `You can cancel your subscription at any time, from the Subscriptions page or from Settings. Upon cancellation, the subscription no longer renews automatically, and access remains active until the end of the period already paid for.`,
        },
      ],
    },
    {
      title: "2. Right of withdrawal (14 days)",
      blocks: [
        {
          kind: "p",
          text: `Under Romanian law (OUG no. 34/2014, implementing Directive 2011/83/EU), you have the right to withdraw from the distance contract within 14 days of purchase, without giving a reason.`,
        },
        {
          kind: "box",
          variant: "info",
          text: `Exception (digital services): if you expressly requested that the service begin before the 14 days expire and confirmed that you lose your right of withdrawal for the part already performed, withdrawal no longer applies to that part, as provided by law.`,
        },
      ],
    },
    {
      title: "3. Refund time and method",
      blocks: [
        {
          kind: "p",
          text: `Where withdrawal applies, we refund the amounts within at most 14 days of the date you informed us of your decision, using the same payment method (card, processed via ${C.procesatorPlati}), at no additional cost to you.`,
        },
      ],
    },
    {
      title: "4. How to request cancellation or a refund",
      blocks: [
        {
          kind: "ul",
          items: [
            `Cancel a subscription: from the Subscriptions page or Settings → Subscription.`,
            `Withdrawal/refund request: email us at ${C.emailContact}, including your account details. We reply within 2 business days.`,
          ],
        },
      ],
    },
  ],
  footer: `For any returns or cancellation questions, contact us at ${C.emailContact}.`,
};

export function getLivrare(locale: string): LegalDoc {
  return locale === "en" ? livrareEn : livrareRo;
}

export function getRetur(locale: string): LegalDoc {
  return locale === "en" ? returEn : returRo;
}
