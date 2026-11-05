# Contributing to Nexo

Thanks for helping improve Nexo. Bug reports, documentation fixes and code contributions are welcome.

For a small fix, you can open a pull request into `dev` directly. For a larger change, open an issue first so we can agree on the approach before you spend time implementing it. Until 1.0, Nexo takes fixes rather than features, as [what 1.0 requires](docs/features-status.md#what-1-0-requires) sets out. Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Set up

Nexo is a JavaScript library. A small .NET project builds its NuGet package.

You'll need:

- Node.js and npm.
- PowerShell to run the build scripts.
- The .NET SDK pinned in `nuget/global.json`.

After cloning the repository, install the test dependencies and run the tests:

```sh
cd tests
npm install
npm test
```

Run the gate from the repository root:

```powershell
./build.ps1
```

The full gate runs it, then packs both packages into `artifacts/` and verifies them as consumers install them. Each package holds exactly the files its list in `scripts/packages/` names, and each installs outside the repository from a local feed: the npm package into a Node project that imports it and type-checks against it, and the NuGet package into a web application whose published `nexo.js` evaluates a script.

```powershell
./build.ps1 -Full
```

## Find your way around

| Location | Contents |
| --- | --- |
| `src/nexo.js` | The entry point, `nexo`, and its declarations in `src/nexo.d.ts` |
| `src/language/` | The language: text, definitions, types, resolution, errors and locations |
| `src/language/vocabulary/` | Modules, their registry, and Nexo's built-in vocabulary |
| `src/common/` | Object and array operations independent of the language |
| `tests/` | Tests arranged to match the source folders, run in Node with no browser |
| `benchmarks/` | The benchmark, a billing app in plain JavaScript and in Nexo |
| `scripts/` | Bundling scripts, and the packages' file lists and verification |
| `nuget/` | The NuGet package project |
| `spec/` | The specification: the language's contract in `language/` and the runtime's in `runtime/`, one document per subject, with its index |
| `docs/` | The design, the guide and the status overview |

The [specification](spec/README.md) defines the language and the runtime a host builds on, and the [design](docs/nexo-design.md) how Nexo is built. If a change affects either, update the relevant document before implementing it. The [status overview](docs/features-status.md) tracks what is implemented, what is being built, and what remains.

## Develop a change

Keep each change focused, and follow the surrounding code's conventions. Use `.editorconfig` for formatting and style. Add or update tests for every source module you change, beside the corresponding source under `tests/`.

Nexo depends on no domain and no browser: nothing in `src/` imports from outside it, which a test enforces, and its tests run in Node.

A change lands on `dev`, from a branch of its own, `feature/<name>` or `fix/<name>`, as [landing work](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/branches.md#landing-work) sets out; `main` holds the latest release, and advances only by promotion. Write each commit as [FormaUI Versioning's commits](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/commits.md) set out: one purpose, passing the gate, its message a Conventional Commit with no attribution trailer.

<a id="versions-and-releases"></a>

## Versions and releases

Nexo follows [FormaUI Versioning `v1.0.0-preview.1`](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/README.md), the rules every FormaUI project versions, branches, commits, releases and packages by. Nexo states here what those rules leave to a project.

**The public contract,** which the [stages](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/versions.md#stages)' promises cover:

- the language's syntax and semantics, as the [language contract](spec/README.md#the-language) states them;
- the runtime's API, as the [runtime contract](spec/README.md#the-runtime) states it and `src/nexo.d.ts` declares it;
- the definition format, the JSON a host and its tools exchange, as [the definition](spec/runtime/definition.md#definition) sets it out.

**The versions,** each declared once, in `src/language/Versions.mjs`:

| Version | Declared as | What carries it | Its history |
| --- | --- | --- | --- |
| The package version | `implementation` | Both packages, the bundle, the release's tag and `nexo.info.versions.implementation` | The [changelog](CHANGELOG.md) |
| The language version | `language` | The language's and the runtime's contracts, as [versions](spec/runtime/versions.md#runtime-versions) set out | The [language history](LANGUAGE-HISTORY.md) |
| The definition version | `definition` | The definition format | The [language history](LANGUAGE-HISTORY.md), each entry naming it |

**The gates.** The fast gate, `./build.ps1`, runs the tests, the bundle, the package project's build with no warnings and the format check. The full gate, `./build.ps1 -Full`, runs it, then packs both packages and verifies them, as [set up](#set-up) describes.

**The workflows:**

| Workflow | Runs on | What it does |
| --- | --- | --- |
| `ci.yml` | Every push but `main`'s, and every pull request | The fast gate, and on a push to `candidate` the full gate, which keeps the packages it verified as its `packages` artifact |
| `promotion.yml` | A pull request into `main` | The [promotion check](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/releases.md#promotion) |
| `release.yml` | A `v*` tag's push, in the `release` environment, which only `v*` tags deploy to | The [release check](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/releases.md#the-release-check), then the full gate's packages attached to the tag's GitHub release with their digests, and published through trusted publishing |

`dev` and `main` require `ci.yml`'s `Gate`, and `main` the `Promotion` check too.

**The packages,** neither depending on a package:

| Package | What it holds | Its targets | Its feed |
| --- | --- | --- | --- |
| npm, `@formaui-net/nexo` | The ES module sources and their declarations, `src/nexo.d.ts`, with the README, license and notice, as `scripts/packages/npm.files` lists them | ES2022 JavaScript: Node, and browsers as modules | npm, under the dist-tag of its stage, `preview` or `rc`, and `latest` for a stable release |
| NuGet, `formaui-net.Nexo` | The bundle, `nexo.js`, and its declarations, served at `_content/nexo/`, with the README, license and notice, as `scripts/packages/nuget.files` lists them, and its symbols beside it, as `scripts/packages/nuget-symbols.files` lists them | `net11.0` applications | nuget.org |

The full gate verifies each, as `scripts/Test-Packages.ps1` sets out. The [changelog](CHANGELOG.md) records each release, and the [language history](LANGUAGE-HISTORY.md) each language version, by their own rules.

<a id="cut-a-release"></a>

## Cut a release

A release is a candidate that passed its full gate, promoted to `main` and tagged there, as [FormaUI Versioning's releases](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/releases.md) set out. Publishing its packages is the step after it.

1. **Set the release on `dev`.** Pause merges unrelated to it, as [stabilizing a candidate](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/branches.md#stabilizing-a-candidate) sets out. Check that `src/language/Versions.mjs` declares the release's version, date the changelog's newest entry by the day of the release, and date the language history's newest entry where it reads *Unreleased*.
2. **Select the candidate.** Fast-forward `candidate` to `dev`'s tip, `git push origin dev:candidate`. `ci.yml` runs the full gate on it. A fix lands on `dev`, and `candidate` moves to the corrected tip.
3. **Promote it.** Open a pull request from `candidate` into `main`, which `promotion.yml` checks. Once the check passes, a release signer fast-forwards `main` to it, `git push origin candidate:main`.
4. **Tag it.** A release signer tags `main`'s commit with an annotated, signed tag, `git tag -s v1.0.0-preview.1 -m "Nexo 1.0.0-preview.1"`, and pushes it, `git push origin v1.0.0-preview.1`. A pushed tag is never moved or deleted.
5. **Publish it.** The tag's push runs `release.yml`, which publishes both packages. A run that fails runs again for the same tag, and publishes what each feed lacks.

After a release, the next change a host can notice opens the changelog's next entry, and the next change to either contract the language history's, as [advancing a version](https://github.com/FormaUI/Versioning/blob/v1.0.0-preview.1/docs/versions.md#advancing-a-version) sets out.

## Measure performance

The benchmark compares a billing app written in plain JavaScript with the same app written as Nexo scripts. Save a run before a change, and compare a run after it:

```sh
node benchmarks/run.mjs --save before.json
node benchmarks/run.mjs --compare before.json
```

- `--quick` takes fewer, shorter samples.
- `--filter` runs the cases whose name holds a text, as `--filter portfolio`.

Each case reports its median time and the bytes one operation allocates, whether collected or not. The benchmark doesn't measure the heap an operation retains.

A case's figures depend on the cases run before it, so compare runs of the same cases only.

To establish a gain, measure the change in pairs against the commit before it, both run in one process:

```sh
git worktree add ../nexo-baseline HEAD
node benchmarks/run.mjs --baseline ../nexo-baseline
```

- Each round measures both, alternating which runs first. `--rounds` sets how many run, 7 by default.
- A case's change is the median of the rounds' changes, with their range beside it.
- Run once against an unchanged copy to see how far rounds differ by chance.
- A gain is established where the median lies beyond that noise, by an effect large enough to matter to a host: a few percent of a case, or a cost a host pays at every evaluation. A gain of a fraction of the noise is none, however many rounds it wins.
- A round that disagrees with the rest is investigated, the machine's load and the order of the cases among the causes, and the rounds measured again. It decides nothing alone.
- Measure on a quiet machine: a build or a test running beside the rounds moves them more than most changes do.

A change made for speed or memory keeps every behaviour the tests check, and is kept only where paired runs show it helps.
