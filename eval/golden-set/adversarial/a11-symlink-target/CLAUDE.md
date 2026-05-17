# Real file

This is the symlink target. The fixture lays out a symlink that points here;
the scanner is configured `followSymbolicLinks: false` so it should be reached
only once (via the real path), not twice (real + via-symlink).
