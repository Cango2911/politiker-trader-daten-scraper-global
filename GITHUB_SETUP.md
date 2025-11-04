# 🚀 GitHub Setup-Anleitung

Schritt-für-Schritt-Anleitung, um Ihr Projekt auf GitHub hochzuladen.

## 📋 Voraussetzungen

- Git installiert
- GitHub-Account erstellt
- Terminal/Command Line Zugriff

---

## 🔧 Schritt 1: Git-Konfiguration prüfen

Öffnen Sie Terminal und prüfen Sie Ihre Git-Konfiguration:

```bash
# Git-Benutzername prüfen
git config --global user.name

# Git-Email prüfen
git config --global user.email

# Falls nicht gesetzt, konfigurieren:
git config --global user.name "Ihr Name"
git config --global user.email "ihre.email@example.com"
```

---

## 🌟 Schritt 2: GitHub Repository erstellen

### Option A: Via Website (Einfacher)

1. Gehen Sie zu: **https://github.com**
2. Klicken Sie auf **"New"** (grüner Button oben rechts)
3. **Repository Name**: `trader-daten-politiker`
4. **Description**: `Globaler Politiker-Trading-Daten Scraper & API für 18 Länder`
5. **Visibility**: Wählen Sie Public oder Private
6. ❌ **NICHT** "Initialize with README" ankreuzen (wir haben bereits eine README)
7. ❌ **NICHT** .gitignore oder License hinzufügen (bereits vorhanden)
8. Klicken Sie **"Create repository"**

---

## 📦 Schritt 3: Lokales Repository initialisieren

Im Terminal, navigieren Sie zu Ihrem Projektordner:

```bash
cd "/Users/canberkkivilcim/Trader Daten Politiker"

# Git initialisieren (falls noch nicht geschehen)
git init

# Branch auf 'main' umbenennen (GitHub Standard)
git branch -M main
```

---

## 📝 Schritt 4: Dateien zu Git hinzufügen

```bash
# Alle Dateien zum Staging hinzufügen
git add .

# Status prüfen (optional)
git status

# Ersten Commit erstellen
git commit -m "🎉 Initial commit: Capitol Trades Global Scraper v1.0.0"
```

---

## 🔗 Schritt 5: GitHub Repository verbinden

Ersetzen Sie `IHR_USERNAME` mit Ihrem GitHub-Benutzernamen:

```bash
git remote add origin https://github.com/IHR_USERNAME/trader-daten-politiker.git

# Verbindung prüfen
git remote -v
```

---

## 🚀 Schritt 6: Code zu GitHub pushen

```bash
# Zum ersten Mal pushen
git push -u origin main
```

**GitHub-Authentifizierung:**

Wenn Sie nach Username/Password gefragt werden:
- **Username**: Ihr GitHub-Username
- **Password**: Verwenden Sie einen **Personal Access Token** (nicht Ihr Passwort!)

### Personal Access Token erstellen:

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token** → **Generate new token (classic)**
3. **Note**: `Git Push Token`
4. **Expiration**: Wählen Sie eine Laufzeit
5. **Scopes**: Wählen Sie `repo` (alle Checkboxen unter repo)
6. **Generate token**
7. **Kopieren Sie den Token** (wird nur einmal angezeigt!)

Verwenden Sie diesen Token als Passwort beim Push.

---

## ✅ Schritt 7: Erfolg überprüfen

1. Gehen Sie zu: `https://github.com/IHR_USERNAME/trader-daten-politiker`
2. Sie sollten alle Ihre Dateien sehen
3. README.md wird automatisch angezeigt

---

## 🎨 Schritt 8: Repository verschönern (Optional)

### Topics hinzufügen

1. Gehen Sie zu Ihrem Repository
2. Klicken Sie auf **⚙️ (Zahnrad)** neben "About"
3. Fügen Sie Topics hinzu:
   - `nodejs`
   - `api`
   - `web-scraping`
   - `puppeteer`
   - `politicians`
   - `trading`
   - `capitol-trades`
   - `mongodb`
   - `express`

### Website URL hinzufügen

Falls deployed:
- Fügen Sie die URL hinzu (z.B. `https://api.ihredomain.de`)

### Social Preview Image

1. Repository Settings → **Options**
2. Scrollen zu **Social preview**
3. **Edit** → Laden Sie ein Bild hoch (1280×640px empfohlen)

---

## 📊 Schritt 9: GitHub Actions aktivieren

GitHub Actions sind bereits konfiguriert (.github/workflows/).

1. Gehen Sie zu **Actions** Tab
2. Aktivieren Sie Workflows falls nötig
3. Bei jedem Push werden automatisch Tests ausgeführt

---

## 🔐 Schritt 10: Secrets konfigurieren (für Auto-Deployment)

Falls Sie Auto-Deployment nutzen möchten:

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**

Fügen Sie hinzu:
```
DOCKER_USERNAME: Ihr Docker Hub Username
DOCKER_PASSWORD: Ihr Docker Hub Token
VPS_HOST: Ihre VPS IP-Adresse
VPS_USERNAME: root oder Ihr Username
VPS_SSH_KEY: Ihr privater SSH-Key
```

---

## 🏷️ Schritt 11: Ersten Release erstellen

```bash
# Tag erstellen
git tag -a v1.0.0 -m "Release v1.0.0: Initial Release"

# Tag pushen
git push origin v1.0.0
```

Auf GitHub:
1. Gehen Sie zu **Releases**
2. **Draft a new release**
3. **Tag**: v1.0.0
4. **Title**: `v1.0.0 - Initial Release`
5. **Description**: Kopieren Sie aus CHANGELOG.md
6. **Publish release**

---

## 🔄 Zukünftige Updates pushen

```bash
# Änderungen machen
# ... Dateien bearbeiten ...

# Status prüfen
git status

# Dateien hinzufügen
git add .

# Committen
git commit -m "feat: Füge neue Funktion hinzu"

# Pushen
git push origin main
```

---

## 🌿 Branches erstellen (Best Practice)

```bash
# Neuen Feature-Branch erstellen
git checkout -b feature/neues-feature

# Änderungen machen und committen
git add .
git commit -m "feat: Implementiere neues Feature"

# Branch pushen
git push origin feature/neues-feature

# Auf GitHub: Pull Request erstellen
```

---

## 📱 GitHub Desktop (Alternative)

Falls Sie lieber eine GUI nutzen:

1. Laden Sie **GitHub Desktop** herunter: https://desktop.github.com/
2. **File** → **Add Local Repository**
3. Wählen Sie Ihren Projektordner
4. **Publish repository**
5. Wählen Sie Public/Private
6. **Publish**

---

## 🎯 Checklist vor dem Push

- [x] `.env` ist in `.gitignore` (✅ schon vorhanden)
- [x] `node_modules` ist in `.gitignore` (✅ schon vorhanden)
- [x] Sensitive Daten entfernt
- [x] README.md aktualisiert
- [x] Tests laufen durch
- [x] Code ist formatiert

---

## 🆘 Troubleshooting

### Problem: "Permission denied"

```bash
# SSH-Key generieren
ssh-keygen -t ed25519 -C "ihre.email@example.com"

# Public Key zu GitHub hinzufügen
cat ~/.ssh/id_ed25519.pub

# Zu GitHub: Settings → SSH Keys → New SSH Key
# Remote URL ändern
git remote set-url origin git@github.com:IHR_USERNAME/trader-daten-politiker.git
```

### Problem: "Repository not found"

```bash
# Remote URL prüfen
git remote -v

# Korrigieren falls nötig
git remote set-url origin https://github.com/IHR_USERNAME/trader-daten-politiker.git
```

### Problem: "Failed to push some refs"

```bash
# Falls Remote Änderungen hat
git pull origin main --rebase

# Dann nochmal pushen
git push origin main
```

---

## 📚 Nützliche Git-Befehle

```bash
# Status anzeigen
git status

# Änderungen anzeigen
git diff

# Log anzeigen
git log --oneline

# Letzten Commit rückgängig (behält Änderungen)
git reset --soft HEAD~1

# Alle lokalen Änderungen verwerfen
git reset --hard

# Branch wechseln
git checkout branch-name

# Branches anzeigen
git branch -a

# Remote-Infos aktualisieren
git fetch

# Von Remote pullen
git pull origin main
```

---

## 🎉 Fertig!

Ihr Projekt ist jetzt auf GitHub! 🚀

**Repository URL:**
```
https://github.com/IHR_USERNAME/trader-daten-politiker
```

**Nächste Schritte:**
1. README.md im Browser prüfen
2. GitHub Actions prüfen (Actions Tab)
3. Star Ihrem eigenen Projekt geben ⭐
4. Mit anderen teilen!

---

## 📞 Hilfe benötigt?

- 📖 [GitHub Docs](https://docs.github.com)
- 💬 [GitHub Community](https://github.community)
- 📧 [Git Dokumentation](https://git-scm.com/doc)

**Viel Erfolg!** 🌟





