#!/bin/sh
# Print the attribution footer expected for the current pi session.
if [ "$PI_CODING_AGENT" = "true" ]; then
  echo "🤖 Created with pi coding agent (model: ${PI_PROVIDER}/${PI_MODEL})"
else
  echo "Not running in pi coding agent (PI_CODING_AGENT != true)."
fi
