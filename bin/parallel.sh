#!/bin/bash

for SCRIPT in "$@"; do
  echo "Running $SCRIPT"
  $SCRIPT &
done

killprocs() {
  echo -e "\n\nKilling processes"
  kill $(jobs -p)
}

echo "Waiting for scripts to finish"
trap killprocs EXIT
wait
