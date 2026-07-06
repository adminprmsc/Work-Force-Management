#!/usr/bin/env bash
set -euo pipefail

# React Native's iOS tooling runs `bundle install` for CocoaPods.
# macOS system Ruby (2.6) is too old for current ffi/CocoaPods gems.
if [[ "$(uname -s)" == "Darwin" ]]; then
  BREW_RUBY="/opt/homebrew/opt/ruby/bin/ruby"
  if [[ -x "$BREW_RUBY" ]]; then
    RUBY_VERSION="$("$BREW_RUBY" -e 'print RUBY_VERSION[/\d+\.\d+/]')"
    export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/${RUBY_VERSION}/0/bin:$PATH"
  fi
fi

exec "$@"
