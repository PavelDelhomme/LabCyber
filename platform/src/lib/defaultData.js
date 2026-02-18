/**
 * Données par défaut intégrées : toujours affichées même si /data/*.json ne répond pas.
 * Évite les imports JSON qui peuvent échouer selon l'environnement de build.
 */
export const EMBEDDED_DOCS = {
  title: 'Documentation du projet',
  description: 'Accès à toute la documentation du lab : démarrage, usage, tests, logs, catégories (Web, Réseau, API, Red/Blue Team, Forensique, OSINT, Stégano, Crypto, Phishing).',
  entries: [
    { id: '00-INDEX', name: 'Index et parcours', file: '00-INDEX.md' },
    { id: 'USAGE', name: 'Comment faire quoi (usage)', file: 'USAGE.md' },
    { id: 'GETTING_STARTED', name: 'Démarrage pas à pas', file: 'GETTING_STARTED.md' },
    { id: 'TESTS', name: 'Tests du système (matrice complète)', file: 'TESTS.md' },
    { id: 'LOGGING', name: 'Système de logs', file: 'LOGGING.md' },
    { id: 'PROXY-VPN', name: 'Proxy et VPN / tunnel', file: 'PROXY-VPN.md' },
    { id: '09-LAB-CATALOG', name: 'Catalogue des labs', file: '09-LAB-CATALOG.md' },
    { id: '08-ENTERPRISE', name: 'Tests entreprise', file: '08-ENTERPRISE-TESTS.md' },
    { id: '01-WEB', name: 'Web (DVWA, Juice Shop, bWAPP)', file: '01-WEB.md' },
    { id: '02-RESEAU', name: 'Réseau (vuln-network)', file: '02-RESEAU.md' },
    { id: '03-APPLICATIONS', name: 'Applications / API', file: '03-APPLICATIONS.md' },
    { id: '04-RED-TEAM', name: 'Red Team', file: '04-RED-TEAM.md' },
    { id: '05-BLUE-TEAM', name: 'Blue Team', file: '05-BLUE-TEAM.md' },
    { id: '06-FORENSIQUE', name: 'Forensique', file: '06-FORENSIQUE.md' },
    { id: '07-OSINT', name: 'OSINT', file: '07-OSINT.md' },
    { id: '10-STEGANOGRAPHY', name: 'Stéganographie', file: '10-STEGANOGRAPHY.md' },
    { id: '11-CRYPTOGRAPHY', name: 'Cryptographie', file: '11-CRYPTOGRAPHY.md' },
    { id: '12-SOCIAL', name: 'Phishing / Social Engineering', file: '12-SOCIAL-ENGINEERING-PHISHING.md' },
    { id: 'CIBLES', name: 'Cibles du lab (targets)', file: 'CIBLES.md' },
    { id: 'CHALLENGES', name: 'Challenges', file: 'CHALLENGES.md' },
    { id: '13-SNIFFING', name: 'Réseau : sniffing, spoofing, paquets', file: '13-RESEAU-SNIFFING-SPOOFING.md' },
    { id: '14-TOPOLOGIE', name: 'Topologie et réseau du lab', file: '14-TOPOLOGIE-RESEAU.md' },
  ],
};

export const EMBEDDED_LEARNING = {
  title: 'Documentation & Cours par thème',
  description: 'Cours et documentation directement dans l\'interface, par thème et sous-catégorie. Complété par des liens externes (OWASP, PortSwigger, etc.).',
  topics: [
    { id: 'web', name: 'Sécurité Web', icon: '🌐', short: 'SQLi, XSS, CSRF, OWASP', content: 'La sécurité des applications web vise à protéger les sites et APIs contre les attaques (injection SQL, XSS, CSRF, etc.). Le référentiel OWASP Top 10 liste les vulnérabilités les plus critiques. Dans le lab, vous pouvez pratiquer sur DVWA, Juice Shop ou bWAPP.', subcategories: [{ id: 'owasp', name: 'OWASP Top 10', content: 'Les 10 vulnérabilités les plus critiques.' }, { id: 'sqli', name: 'Injection SQL', content: 'Une injection SQL permet d\'exécuter du code SQL non prévu. Prévention : requêtes paramétrées.' }, { id: 'xss', name: 'XSS', content: 'Le XSS injecte du JavaScript dans une page vue par d\'autres utilisateurs. Prévention : échappement des sorties.' }], documentation: [{ label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' }, { label: 'OWASP Testing Guide', url: 'https://owasp.org/www-project-web-security-testing-guide/' }], courses: [{ label: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security' }], tools: [{ name: 'Burp Suite', url: 'https://portswigger.net/burp', desc: 'Proxy / scanner web' }, { name: 'OWASP ZAP', url: 'https://www.zaproxy.org/', desc: 'Scanner vulnérabilités' }, { name: 'sqlmap', url: 'https://sqlmap.org/', desc: 'Injections SQL' }] },
    { id: 'crypto', name: 'Cryptographie', icon: '🔐', short: 'AES, RSA, Base64, hachage', content: 'La cryptographie assure confidentialité (chiffrement), intégrité (hachage) et authentification. En pentest et CTF : Base64, AES, RSA, hachages (MD5, SHA) avec John ou hashcat.', subcategories: [{ id: 'chiffrement', name: 'Chiffrement', content: 'Symétrique (AES) et asymétrique (RSA).' }, { id: 'hachage', name: 'Hachage', content: 'Empreinte fixe (SHA-256). Casse avec John, hashcat.' }], documentation: [{ label: 'OpenSSL', url: 'https://www.openssl.org/docs/' }, { label: 'CTF 101 – Crypto', url: 'https://ctf101.org/cryptography/overview/' }], courses: [{ label: 'CryptoHack', url: 'https://cryptohack.org/' }], tools: [{ name: 'OpenSSL', url: 'https://www.openssl.org/', desc: 'AES/RSA, certificats' }, { name: 'John the Ripper', url: 'https://www.openwall.com/john/', desc: 'Casseur de mots de passe' }, { name: 'CyberChef', url: 'https://gchq.github.io/CyberChef/', desc: 'Encode/decode, Base64' }] },
    { id: 'stego', name: 'Stéganographie', icon: '🖼️', short: 'Données cachées dans images / audio', content: 'La stéganographie cache des données dans des fichiers (images, audio). En CTF : steghide, binwalk, exiftool.', documentation: [{ label: 'Steghide', url: 'https://steghide.sourceforge.io/' }], courses: [], tools: [{ name: 'steghide', url: 'https://steghide.sourceforge.io/', desc: 'Images (mot de passe)' }, { name: 'binwalk', url: 'https://github.com/ReFirmLabs/binwalk', desc: 'Fichiers embarqués' }, { name: 'exiftool', url: 'https://exiftool.org/', desc: 'Métadonnées EXIF' }] },
    { id: 'phishing', name: 'Phishing & Social Engineering', icon: '📧', short: 'Hameçonnage, défense', content: 'Le phishing vise à obtenir des identifiants via emails ou sites trompeurs. Défense : formation, simulations (Gophish).', documentation: [{ label: 'ANSSI – Hameçonnage', url: 'https://www.ssi.gouv.fr/entreprise/boite-outils/fiches-pratiques/le-hameconnage-phishing/' }], courses: [], tools: [{ name: 'Gophish', url: 'https://getgophish.com/', desc: 'Simulation de phishing' }] },
    { id: 'network', name: 'Réseau & Pentest', icon: '🔌', short: 'Scan, services, Redis, SSH', content: 'Pentest réseau : scanner les ports (Nmap), identifier les services, tester authentifications (Hydra), configurations (Redis, SSH).', documentation: [{ label: 'Nmap Reference', url: 'https://nmap.org/book/man.html' }, { label: 'Redis Security', url: 'https://redis.io/docs/management/security/' }], courses: [], tools: [{ name: 'Nmap', url: 'https://nmap.org/', desc: 'Scan de ports' }, { name: 'Hydra', url: 'https://github.com/vanhauser-thc/thc-hydra', desc: 'Brute-force SSH, HTTP' }] },
    { id: 'api', name: 'Applications & API', icon: '⚙️', short: 'REST, auth, IDOR', content: 'Les API REST : authentification (JWT), contrôle d\'accès (IDOR), injection. OWASP API Security Top 10.', documentation: [{ label: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/' }], courses: [{ label: 'PortSwigger – API Security', url: 'https://portswigger.net/web-security/api-security' }], tools: [{ name: 'Postman', url: 'https://www.postman.com/', desc: 'Tester des API' }, { name: 'curl', url: 'https://curl.se/', desc: 'Requêtes HTTP CLI' }] },
    { id: 'forensics', name: 'Forensique', icon: '🔍', short: 'Pcap, trafic, analyse', content: 'Analyse forensique réseau : capture (tcpdump, Wireshark), analyse du trafic, filtres, protocoles.', documentation: [{ label: 'Wireshark User Guide', url: 'https://www.wireshark.org/docs/wsug_html/' }], courses: [], tools: [{ name: 'Wireshark', url: 'https://www.wireshark.org/', desc: 'Analyse de trafic' }, { name: 'tcpdump', url: 'https://www.tcpdump.org/', desc: 'Capture paquets CLI' }] },
    { id: 'osint', name: 'OSINT', icon: '📡', short: 'Reconnaissance, sources ouvertes', content: 'OSINT : informations depuis sources publiques (moteurs, réseaux sociaux, DNS, Shodan). Première phase du pentest.', documentation: [{ label: 'OSINT Framework', url: 'https://osintframework.com/' }], courses: [], tools: [{ name: 'theHarvester', url: 'https://github.com/laramies/theHarvester', desc: 'Emails, sous-domaines' }, { name: 'Shodan', url: 'https://www.shodan.io/', desc: 'Appareils connectés' }] },
    { id: 'red', name: 'Red Team & Pentest', icon: '🔴', short: 'Test d\'intrusion, exploitation', content: 'Red Team simule un attaquant. Méthodologies : PTES, MITRE ATT&CK. Outils : Kali, Metasploit. TryHackMe, HackTheBox.', documentation: [{ label: 'PTES', url: 'http://www.pentest-standard.org/' }, { label: 'MITRE ATT&CK', url: 'https://attack.mitre.org/' }], courses: [{ label: 'TryHackMe', url: 'https://tryhackme.com/path/outline/pentesting' }, { label: 'HackTheBox', url: 'https://www.hackthebox.com/' }], tools: [{ name: 'Kali Linux', url: 'https://www.kali.org/', desc: 'Distribution pentest' }, { name: 'Metasploit', url: 'https://www.metasploit.com/', desc: 'Framework d\'exploitation' }] },
    { id: 'blue', name: 'Blue Team & Détection', icon: '🔵', short: 'IDS/IPS, SIEM', content: 'Blue Team défend et détecte. IDS/IPS (Suricata), SIEM pour les logs.', documentation: [{ label: 'Suricata', url: 'https://suricata.io/documentation/' }], courses: [], tools: [{ name: 'Suricata', url: 'https://suricata.io/', desc: 'IDS/IPS' }] },
    { id: 'cve', name: 'CVE & Vulnérabilités', icon: '⚠️', short: 'Bases CVE, NVD', content: 'Les CVE identifient des vulnérabilités publiques. NVD (NIST), CVE.mitre.org. Bouton CVE flottant dans l\'app pour ouvrir sur NVD.', documentation: [{ label: 'NVD (NIST)', url: 'https://nvd.nist.gov/vuln/search' }, { label: 'CVE.mitre.org', url: 'https://cve.mitre.org/' }], courses: [], tools: [{ name: 'NVD Search', url: 'https://nvd.nist.gov/vuln/search', desc: 'Recherche CVE' }] },
    { id: 'systemes', name: 'Systèmes & Réseau', icon: '🖥️', short: 'Linux, protocoles', content: 'Bases Linux et protocoles (TCP/IP, DNS, HTTP). Terminal attaquant (Kali) et cibles en CLI.', documentation: [{ label: 'Linux man pages', url: 'https://man7.org/linux/man-pages/' }, { label: 'RFC Editor', url: 'https://www.rfc-editor.org/' }], courses: [], tools: [{ name: 'Kali (lab)', url: '#', desc: 'Terminal attaquant' }, { name: 'Wireshark', url: 'https://www.wireshark.org/', desc: 'Paquets' }] },
  ],
};

export const EMBEDDED_TARGETS = [
  { id: 'dvwa', name: 'DVWA', type: 'web', description: 'Damn Vulnerable Web Application – OWASP Top 10 (SQLi, XSS, CSRF, etc.).', url: 'http://dvwa.lab:8080', credentials: 'admin / password', access: 'Navigateur ou curl depuis attaquant' },
  { id: 'juice-shop', name: 'OWASP Juice Shop', type: 'web', description: 'Application web volontairement vulnérable – défis XSS, auth, injection.', url: 'http://juice.lab:8080', credentials: 'Divers (voir défis)', access: 'Navigateur ou curl' },
  { id: 'bwapp', name: 'bWAPP', type: 'web', description: 'Buggy Web Application – vulnérabilités web classiques.', url: 'http://bwapp.lab:8080', credentials: 'bee / bug', access: 'Navigateur' },
  { id: 'vuln-api', name: 'vuln-api', type: 'api', description: 'API REST volontairement vulnérable : auth faible, IDOR, SQLi. OWASP API Security.', url: 'http://api.lab:8080', credentials: 'admin / admin123 ou user / user123', access: 'Navigateur ou curl' },
  { id: 'vuln-network', name: 'vuln-network', type: 'network', description: 'Cible réseau : SSH (mot de passe faible) et Redis (sans auth). Pentest, brute force, Redis.', url: null, hostname: 'vuln-network', ports: '22 (SSH), 6379 (Redis)', credentials: 'SSH : root / labpassword. Redis : pas de mot de passe.', access: 'Depuis attaquant : ssh root@vuln-network, redis-cli -h vuln-network' },
  { id: 'desktop', name: 'Bureau noVNC (XFCE)', type: 'desktop', description: 'Bureau graphique à distance pour outils GUI.', url: 'http://127.0.0.1:8080/desktop/', credentials: 'VNC : labcyber', access: 'Navigateur' },
  { id: 'attaquant', name: 'Machine attaquant (Kali)', type: 'attaquant', description: 'Terminal avec nmap, hydra, sqlmap, tcpdump, scapy, etc.', url: 'http://127.0.0.1:8080/terminal/', access: 'Terminal web (lien plateforme)' },
];
