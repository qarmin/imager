fix:
    biome format --write --javascript-formatter-line-width=120
    
pack_to_zip:
    rm imager.zip || true
    zip -r imager.zip . -x "*.git*" "*.idea*" "justfile" "imager.zip"

run:
    web-ext run --devtools