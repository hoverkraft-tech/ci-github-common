"""Convert one normalized LCOV measurement using the pinned converter."""

import importlib
import sys
from pathlib import Path

# The package directory is installed from this action's hash-pinned requirements,
# never from the tested project's dependency configuration.
sys.path.insert(0, sys.argv[1])
LcovCobertura = importlib.import_module("lcov_cobertura").LcovCobertura

source = Path(sys.argv[2]).read_text(encoding="utf-8")
result = LcovCobertura(source, base_dir=".").convert()
Path(sys.argv[3]).write_text(result, encoding="utf-8")
