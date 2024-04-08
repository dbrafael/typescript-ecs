WATCHDIR=$1
CMD=$2

if [ -z "$WATCHDIR" ] || [ -z "$CMD" ]; then
    echo "Usage: $0 <watchdir> <cmd>"
    exit 1
fi

inotifywait --monitor --recursive --event modify $WATCHDIR | while read line; do
    $CMD
    nvim --server /tmp/nvsock --remote-send ':LspRestart<CR>:echo "Reloaded LSP"<CR>'
done
# watch -n 120 -t -d $CMD

