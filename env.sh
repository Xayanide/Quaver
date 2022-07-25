#!/bin/bash

# This is normally done automatically if using zsh or fish
export default BUN_TMPDIR="${HOME}/.bun/install/tmp"
export default PATH=$PATH:"${HOME}/.bun/bin"
export default BUN_INSTALL=$HOME/.bun

# This works around a bug with bun install that will be fixed in v0.0.79
rm -rf $BUN_TMPDIR
mkdir -p $BUN_TMPDIR

source ./install.sh
