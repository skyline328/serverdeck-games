# Serverdeck-Spiele

Katalog mit Spiel-Vorlagen für [Serverdeck](https://github.com/skyline328/serverdeck). Das Panel lädt ihn unter
**Spiele → Katalog**: neue Spiele mit einem Klick installieren, Updates werden angezeigt – ohne Panel-Update.

| Spiel | Installation | Status |
| ----- | ------------ | ------ |
| 7 Days to Die | SteamCMD | Beta |
| Terraria (Vanilla) | Download von terraria.org | Beta |

*Beta* heißt: folgt der offiziellen Dokumentation, aber noch wenig im Dauerbetrieb erprobt.

## Ein Spiel hinzufügen

1. Am einfachsten im Panel unter **Spiele → Neue Vorlage** entwerfen und testen – der Editor prüft beim Tippen.
   Dann **Exportieren**.
2. Die Datei als `games/<id>.yaml` hier ablegen (Dateiname = `id`).
3. Pull Request öffnen. Die Prüfung läuft automatisch; nach dem Merge erzeugt GitHub `catalog.json` neu.

Bei jeder Änderung an einer Vorlage **`version` erhöhen** – daran erkennt das Panel, dass es ein Update gibt.

## Format in Kürze

Das vollständige Format steht in der
[Serverdeck-Dokumentation](https://github.com/skyline328/serverdeck/blob/main/templates/README.md).

```yaml
id: mein-spiel
version: 1
name: Mein Spiel
short: MS
hue: 210

# Entweder ein fertiges Docker-Image …
# image: beispiel/mein-spiel:latest
# … oder eine Serverdeck-Laufzeit, in die das Spiel installiert wird:
runtime: base                  # base, java8 … java25, wine, dotnet8
install:
  steamcmd: { app: 123456 }    # und/oder download: { url: …, strip: 1 }, script: …
start: ./server -port {{port.game}} -name "$SERVER_NAME"

resources: { minMemoryMb: 1024, defaultMemoryMb: 2048, defaultCpuPercent: 100 }
ports:
  - { name: game, label: Spiel-Port, container: 7777, protocol: udp, default: 7777, matchHost: true }
variables:
  - { key: SERVER_NAME, label: Servername, type: text, default: Mein Server }

# Optional: Config-Dateien für den Bereich „Konfiguration“ (ab Serverdeck 0.7).
# Nicht beschriebene Einträge erscheinen automatisch, true/false als Kippschalter.
configs:
  - file: config/server.ini     # relativ zum Server-Verzeichnis, {{var.X}} erlaubt
    label: Server-Einstellungen
    fields:
      PvP: { label: PvP, group: Spiel }
      Hardcore: { type: boolean, trueValue: 1, falseValue: 0 }
      Port: { readOnly: Wird von Serverdeck gesetzt. }
```

Regeln, die die Prüfung durchsetzt:

- Eingaben (Texte, Passwörter) gehören als `"$VARIABLE"` in Befehle, nicht als `{{var.…}}`.
- `{{port.…}}`, Zahlen und Auswahlfelder dürfen als Platzhalter verwendet werden.
- Alles läuft im Container – nie direkt auf dem Server des Betreibers.

## Lokal prüfen

```bash
npm ci
npm run check    # prüft die Vorlagen und ob catalog.json aktuell ist
npm run build    # catalog.json neu schreiben
```
