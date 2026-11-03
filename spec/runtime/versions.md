# Versions

<a id="runtime-versions"></a>

An implementation says which it is, and what it follows, in `nexo.info.versions`, three versions that change apart:

| Property | What it is |
| --- | --- |
| `implementation` | The implementation's release version, which its packages carry, as `1.0.0-beta.1`; its sources and every build of them report the same |
| `language` | The language specification version the implementation follows |
| `definition` | The definition format version the implementation supports |

Each is declared, never computed, and advances for its own reason:

- **The implementation's version** advances with each of its releases.
- **The specification version** advances at most once per release, for the changes to the language's contract made since the release before it.
- **The definition version** advances at most once per release, for the changes to the serialized definition's contract made since then.

A specification or definition version is fixed once a release implements it; until then, the newest may still gain changes. Their numbers may coincide, and neither determines another, so one specification version is followed by many releases of an implementation, and a specification can describe a version ahead of the one an implementation follows.
