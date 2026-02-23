# Social Engineering, Phishing et Spam – Apprentissage et défense

## Objectifs

- Comprendre ce qu’est le **phishing**, le **spam** et le **social engineering**.
- Apprendre à **reconnaître** les emails et pages de phishing, et les arnaques.
- Savoir **se défendre** et sensibiliser (bonnes pratiques, reporting).
- Connaître le cadre **légal et éthique** (tests uniquement avec autorisation).

## Définitions

| Terme | Description |
|-------|-------------|
| **Phishing** | Technique pour obtenir des identifiants ou des données en faisant croire à la victime qu’elle s’adresse à un tiers de confiance (banque, entreprise, plateforme). Souvent par email + fausse page de connexion. |
| **Spam** | Envoi massif de messages non sollicités. Peut être publicitaire, malveillant (phishing, malware) ou arnaque (promesse fausse, urgence). |
| **Social engineering** | Manipulation psychologique pour obtenir une action (cliquer, divulguer un mot de passe, ouvrir une pièce jointe). S’appuie sur la confiance, l’urgence, l’autorité, la curiosité. |

## Reconnaître le phishing (emails et pages)

### Indices dans l’email

- **Expéditeur** : adresse qui imite un nom connu (ex: `support@banque-securise.com` au lieu du vrai domaine).
- **Liens** : URL affichée ≠ URL réelle (survoler le lien sans cliquer), domaine suspect (.tk, redirections).
- **Formulation** : urgence (« Votre compte sera bloqué »), demande de clic ou de saisie de mot de passe.
- **Pièces jointes** : fichiers .exe, .scr, ou documents demandant d’« activer les macros ».

### Indices sur une page (fausse connexion)

- **URL** : pas le bon domaine (ex: `http://banque-securise.xyz` au lieu de `https://www.ma-banque.fr`).
- **HTTPS** : cadenas et certificat valide pour le vrai site, pas pour le clone.
- **Contenu** : fautes, mise en page approximative, champs inhabituels.

### Exercice sur la plateforme

La **plateforme web** (http://localhost:4080) propose une **page de démo pédagogique** (exemple de fausse page de connexion) dans la room **Phishing**. Objectif : voir à quoi peut ressembler une page de phishing, sans jamais l’utiliser contre de vraies personnes.

## Spam et arnaques

- **Types** : promesse de gain, faux support technique, « vous avez gagné », urgence fiscale, faux dirigeant (BEC).
- **Défense** : ne pas cliquer, ne pas répondre, signaler (signal-spam.fr, plateforme PHAROS), filtrer (antispam, règles).
- **En entreprise** : formation des utilisateurs, simulation de phishing autorisée, remontée des incidents.

## Social engineering – Principes et défense

- **Principes utilisés** : autorité (faux IT, faux patron), urgence, rareté, confiance, peur.
- **Vecteurs** : email, téléphone (vishing), SMS (smishing), réseaux sociaux, physique (tailgating, badge).
- **Défense** : vérifier l’identité par un canal indépendant, ne pas divulguer de mots de passe ou codes, politique de non-révélation d’infos sensibles au téléphone/email.

## Cadre légal et éthique

- **Reconnaître et analyser** du phishing (emails, captures) pour apprendre : licite.
- **Tester la sensibilisation** en entreprise : uniquement dans le cadre d’une **campagne autorisée** (direction, RSSI, prestataire avec mandat).
- **Envoyer de vrais emails de phishing** à des personnes sans autorisation explicite : **illégal** (usurpation, accès frauduleux).
- Ce lab fournit de la **documentation et une démo pédagogique** (page factice sur localhost). Ne pas réutiliser pour cibler des tiers.

## Tests en entreprise (avec autorisation)

- **Simulation de phishing** : outillage dédié (GoPhish, plateformes managées), scénarios validés, cibles consentantes (salariés dans le cadre d’une campagne).
- **Awareness** : formation, quiz, retours après simulation.
- Référentiels : bonnes pratiques ANSSI, PCI-DSS (sensibilisation), ISO 27001 (contrôle humain).

## Ressources

- [ANSSI – Bien réagir face à un courriel de phishing](https://www.ssi.gouv.fr/)
- [Signal Spam](https://www.signal-spam.fr/) – signalement
- [Cybermalveillance.gouv.fr](https://www.cybermalveillance.gouv.fr/) – conseils et signalement
