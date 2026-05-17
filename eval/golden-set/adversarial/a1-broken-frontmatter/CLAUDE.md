---
name: agent-with-broken-frontmatter
description: this YAML deliberately ends without the closing fence
unterminated: [a, b, c
---

# Broken frontmatter

The frontmatter above is intentionally malformed. Parser should emit a warning
but still treat the rest of the file as body.
