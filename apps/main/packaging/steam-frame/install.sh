#!/bin/sh
set -eu

payload="$1"
apps="$HOME/Applications"
data="${XDG_DATA_HOME:-$HOME/.local/share}"

mkdir -p "$apps" "$data/applications" "$data/icons/hicolor/512x512/apps"
cp "$payload/Ensemble.AppImage" "$apps/Ensemble.AppImage.new"
chmod +x "$apps/Ensemble.AppImage.new"
mv "$apps/Ensemble.AppImage.new" "$apps/Ensemble.AppImage"
cp "$payload/ensemble.png" "$data/icons/hicolor/512x512/apps/ensemble.png"

cat > "$data/applications/com.czechslash.ensemble.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Ensemble
Comment=Beat Saber fleet and event companion
Exec=env APPIMAGE_EXTRACT_AND_RUN=1 $apps/Ensemble.AppImage %U
Icon=ensemble
Terminal=false
Categories=Utility;
MimeType=x-scheme-handler/ensemble;application/x-beatsaber-playlist;
StartupWMClass=com.czechslash.ensemble
Keywords=beat saber;mods;maps;playlists;
DESKTOP

update-desktop-database "$data/applications" 2>/dev/null || true
xdg-mime default com.czechslash.ensemble.desktop x-scheme-handler/ensemble 2>/dev/null || true

APPIMAGE_EXTRACT_AND_RUN=1 setsid "$apps/Ensemble.AppImage" > /dev/null 2>&1 < /dev/null &
