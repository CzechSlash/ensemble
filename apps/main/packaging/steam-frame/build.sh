#!/bin/sh
set -eu

appimage="$(realpath "$1")"
output="$(realpath -m "$2")"
here="$(dirname "$(realpath "$0")")"
icon="$here/../../../../assets/encore-icon.png"
id=com.czechslash.ensemble.Installer
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

app="$work/app"
mkdir -p "$app/files/bin" "$app/files/share/ensemble" "$app/files/share/applications" "$app/files/share/metainfo" "$app/files/share/icons/hicolor/512x512/apps"
cat > "$app/metadata" <<METADATA
[Application]
name=$id
runtime=org.freedesktop.Platform/aarch64/25.08
sdk=org.freedesktop.Sdk/aarch64/25.08
command=ensemble-installer
METADATA

install -m755 "$here/ensemble-installer" "$app/files/bin/ensemble-installer"
install -m644 "$here/install.sh" "$app/files/share/ensemble/install.sh"
install -m755 "$appimage" "$app/files/share/ensemble/Ensemble.AppImage"
uv run --quiet --with pillow python -c "import sys; from PIL import Image; Image.open(sys.argv[1]).resize((512, 512), Image.LANCZOS).save(sys.argv[2])" "$icon" "$app/files/share/ensemble/ensemble.png"
cp "$app/files/share/ensemble/ensemble.png" "$app/files/share/icons/hicolor/512x512/apps/$id.png"
install -m644 "$here/$id.desktop" "$app/files/share/applications/$id.desktop"
install -m644 "$here/$id.metainfo.xml" "$app/files/share/metainfo/$id.metainfo.xml"

flatpak build-finish "$app" --share=ipc --talk-name=org.freedesktop.Flatpak > /dev/null
flatpak build-export --arch=aarch64 --disable-sandbox "$work/repo" "$app" master > /dev/null
flatpak build-bundle --arch=aarch64 --runtime-repo=https://dl.flathub.org/repo/flathub.flatpakrepo "$work/repo" "$output" "$id" master
echo "$output"
