# Pick & Tip - Comparatif des Taxes Immobilières Internationales

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> **Savoir pour avoir** | **Knowing for owning**

Outil interactif de comparaison des taxes foncières et droits de mutation immobilière dans plus de 80 pays, conçu pour les investisseurs internationaux, expatriés et digital nomads.

**[English version below](#english-version)**

---

## 🌍 À propos

Pick & Tip est une application web interactive qui permet de comparer rapidement les taxes immobilières à travers le monde. Elle fournit des informations essentielles sur :

- **Taxes foncières annuelles** : Le pourcentage du revenu cadastral ou de la valeur du bien à payer chaque année
- **Droits de mutation** : Les taxes à payer lors de l'achat d'un bien immobilier
- **Notes détaillées** : Spécificités locales et variations selon les régions

## ✨ Fonctionnalités

### Interface utilisateur
- 📊 **Tableau comparatif dynamique** de 85+ pays
- 🔍 **Recherche en temps réel** par nom de pays
- 🌍 **Filtres géographiques** (Europe, Amérique, Asie, Moyen-Orient, Afrique, Océanie)
- 🎯 **Filtres rapides** : Sans taxe / Taxe faible (< 0.5%)
- 🔄 **Tri interactif** sur toutes les colonnes
- 🎨 **Code couleur intelligent** :
  - 🟢 Vert : Aucune taxe ou < 0.5%
  - 🟡 Orange : 0.5% - 1.5%
  - 🔴 Rouge : > 1.5%

### Internationalisation
- 🇫🇷 **Français**
- 🇬🇧 **Anglais**
- 🔄 Détection automatique de la langue du navigateur
- 💾 Préférence de langue sauvegardée localement

### Performance
- ⚡ **Zéro dépendances** : JavaScript vanilla pur
- 🚀 **Chargement ultra-rapide** : Pas de framework lourd
- 📱 **100% responsive** : Fonctionne sur tous les appareils
- 💻 **Fonctionne hors ligne** après le premier chargement

## 🛠️ Technologies utilisées

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Design moderne avec variables CSS, Grid et Flexbox
- **JavaScript ES6+** - Logique applicative sans framework

### Données
- **JSON** - Format structuré pour les données et traductions
- **localStorage** - Persistance de la préférence de langue

### Design
- **Google Fonts** : Montserrat + JetBrains Mono
- **Emoji Unicode** : Drapeaux et icônes sans images
- **Palette Pick & Tip** : Bleu foncé (#0A3460) + Or (#F2C744)

## 📦 Installation

### Prérequis
Aucun ! Le projet fonctionne directement dans un navigateur moderne.

### Cloner le projet
```bash
git clone https://github.com/pickandtip/pickandtip.github.io.git
cd pickandtip.github.io
```

### Lancer localement

#### Option 1 : Serveur HTTP simple avec Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Option 2 : Serveur HTTP simple avec Node.js
```bash
npx http-server -p 8000
```

#### Option 3 : Live Server (VS Code)
Installez l'extension "Live Server" et cliquez sur "Go Live"

Puis ouvrez votre navigateur à l'adresse : `http://localhost:8000`

## 📂 Structure du projet

```
/siteapp/
├── index.html              # Page principale
├── README.md              # Documentation (ce fichier)
├── css/
│   └── styles.css         # Styles CSS complets
├── js/
│   └── app.js            # Logique applicative JavaScript
└── data/
    ├── countries/
    │   └── countries.json        # Base de 85+ pays avec métadonnées
    ├── i18n/
    │   ├── fr.json              # Traductions françaises
    │   └── en.json              # Traductions anglaises
    └── topics/
        └── property-taxes.json   # Données fiscales par pays
```

## 🔧 Configuration

### Ajouter un pays

1. Ouvrez `data/countries/countries.json`
2. Ajoutez une nouvelle entrée :
```json
{
  "code": "XX",
  "name": {
    "fr": "Nom du pays",
    "en": "Country name"
  },
  "flag": "🏳️",
  "region": "europe"
}
```

3. Ouvrez `data/topics/property-taxes.json`
4. Ajoutez les données fiscales correspondantes :
```json
{
  "country": "XX",
  "propertyTax": "0.5-1%",
  "transferTax": "5%",
  "notes": {
    "fr": "Détails en français",
    "en": "Details in English"
  }
}
```

### Modifier les traductions

Éditez les fichiers dans `data/i18n/` :
- `fr.json` pour le français
- `en.json` pour l'anglais

### Personnaliser les couleurs

Modifiez les variables CSS dans `css/styles.css` :
```css
:root {
    --primary-color: #0A3460;  /* Bleu foncé Pick & Tip */
    --accent-color: #F2C744;   /* Or Pick & Tip */
    /* ... */
}
```

## 📊 Sources des données

Les données fiscales proviennent de sources officielles et sont mises à jour régulièrement :
- Administrations fiscales nationales
- Cabinets de conseil fiscal internationaux
- Rapports de l'OCDE et de la Banque Mondiale

**Dernière mise à jour : Décembre 2025**

⚠️ **Avertissement** : Ces données sont fournies à titre indicatif uniquement. Les taux peuvent varier selon les régions, le type de bien et votre situation personnelle. Consultez toujours un conseiller fiscal local avant toute décision d'investissement.

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Forkez le projet**
2. **Créez une branche** pour votre fonctionnalité :
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Committez vos changements** :
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Pushez vers la branche** :
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Ouvrez une Pull Request**

### Types de contributions acceptées
- 📝 Mise à jour des données fiscales
- 🌍 Ajout de nouveaux pays
- 🐛 Corrections de bugs
- ✨ Nouvelles fonctionnalités
- 🌐 Traductions dans d'autres langues
- 📖 Améliorations de la documentation

## 📜 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🔗 Liens

- **Chaîne YouTube** : [@pickandtip](https://www.youtube.com/@pickandtip)
- **Site web** : [pickandtip.github.io](https://pickandtip.github.io)

## 📧 Contact

Pour toute question ou suggestion, visitez notre chaîne YouTube ou ouvrez une issue sur GitHub.

---

## 🙏 Remerciements

Merci à la communauté Pick & Tip pour le soutien et les retours !

**Thématiques de la chaîne** : Or • Crypto • Investissement International • Mobilité

---

# English Version

## 🌍 About

Pick & Tip is an interactive web application for comparing real estate taxes worldwide. It provides essential information on:

- **Annual Property Taxes**: The percentage of cadastral income or property value payable each year
- **Transfer Duties**: Taxes payable when purchasing real estate
- **Detailed Notes**: Local specifics and regional variations

## ✨ Features

### User Interface
- 📊 **Dynamic comparison table** of 85+ countries
- 🔍 **Real-time search** by country name
- 🌍 **Geographic filters** (Europe, America, Asia, Middle East, Africa, Oceania)
- 🎯 **Quick filters**: No tax / Low tax (< 0.5%)
- 🔄 **Interactive sorting** on all columns
- 🎨 **Smart color coding**:
  - 🟢 Green: No tax or < 0.5%
  - 🟡 Orange: 0.5% - 1.5%
  - 🔴 Red: > 1.5%

### Internationalization
- 🇫🇷 **French**
- 🇬🇧 **English**
- 🔄 Automatic browser language detection
- 💾 Language preference saved locally

### Performance
- ⚡ **Zero dependencies**: Pure vanilla JavaScript
- 🚀 **Ultra-fast loading**: No heavy framework
- 📱 **100% responsive**: Works on all devices
- 💻 **Works offline** after first load

## 🛠️ Technologies

### Frontend
- **HTML5** - Semantic structure
- **CSS3** - Modern design with CSS variables, Grid and Flexbox
- **JavaScript ES6+** - Application logic without framework

### Data
- **JSON** - Structured format for data and translations
- **localStorage** - Language preference persistence

### Design
- **Google Fonts**: Montserrat + JetBrains Mono
- **Unicode Emoji**: Flags and icons without images
- **Pick & Tip Palette**: Dark blue (#0A3460) + Gold (#F2C744)

## 📦 Installation

### Prerequisites
None! The project works directly in any modern browser.

### Clone the project
```bash
git clone https://github.com/pickandtip/pickandtip.github.io.git
cd pickandtip.github.io
```

### Run locally

#### Option 1: Simple HTTP server with Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Option 2: Simple HTTP server with Node.js
```bash
npx http-server -p 8000
```

#### Option 3: Live Server (VS Code)
Install the "Live Server" extension and click "Go Live"

Then open your browser at: `http://localhost:8000`

## 📊 Data Sources

Tax data comes from official sources and is regularly updated:
- National tax administrations
- International tax consulting firms
- OECD and World Bank reports

**Last update: December 2025**

⚠️ **Disclaimer**: This data is provided for informational purposes only. Rates may vary by region, property type, and your personal situation. Always consult a local tax advisor before making any investment decision.

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork the project**
2. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Accepted contribution types
- 📝 Tax data updates
- 🌍 Adding new countries
- 🐛 Bug fixes
- ✨ New features
- 🌐 Translations to other languages
- 📖 Documentation improvements

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **YouTube Channel**: [@pickandtip](https://www.youtube.com/@pickandtip)
- **Website**: [pickandtip.github.io](https://pickandtip.github.io)

## 📧 Contact

For any questions or suggestions, visit our YouTube channel or open an issue on GitHub.

---

## 🙏 Acknowledgments

Thanks to the Pick & Tip community for the support and feedback!

**Channel Topics**: Gold • Crypto • International Investment • Mobility

---

**Made with ❤️ by Pick & Tip**
