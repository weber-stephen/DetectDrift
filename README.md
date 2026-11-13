# DriftDetect OSS CLI

DriftDetect runs repository-owned commands and checks their stdout against deterministic JSON and text assertions. It catches explicit output-contract regressions; it cannot establish factual correctness or detect every change in AI behavior.

## Quick start

Use Node.js 24. Install `@weberstephen/driftdetect` at an exact version in your repository and commit its lockfile. Copy the [example case file](examples/support-triage/driftdetect.json) and [workflow](examples/support-triage/.github/workflows/driftdetect.yml), then replace the fixture command with your application entrypoint. The [setup skill](skills/driftdetect-setup/SKILL.md) guides this change. The [JSON Schema](driftdetect.schema.json) describes the config shape; offline `check` also enforces cross-field rules.

```sh
./node_modules/.bin/driftdetect check --config driftdetect.json --format json
./node_modules/.bin/driftdetect run --config driftdetect.json
```

`check` reads only the explicit JSON config and needs no credentials. `run` sends `input` to the configured executable's stdin as UTF-8 from the repository root, then checks stdout. Commands are literal argument arrays, with no shell. `requiredEnv` lists variable names needed before any case launches. Map only those names to GitHub secrets in the default-branch workflow. The fixture example needs none.

Assertions support whole-output `json`, RFC 6901 `fields` with `string`, `number`, `boolean`, `object`, `array`, or `null` types, and case-sensitive literal `contains` and `notContains`. At least one assertion is required. Cases are sequential, at most ten; each command runs once with a 30-second timeout, 16 KiB input, and 64 KiB limits on stdout and stderr. Exit 0 means all pass, 1 means assertion failures only, and 2 means invalid config, missing environment, command, or report error. `--format json` emits one redacted object.

## Costs and privacy

The CLI has no provider SDK or hosted account. Your commands may make paid model calls and should control their own retries, timeouts, tokens, and spend. Case inputs and assertion values are Git-tracked; keep them non-sensitive. Reports omit raw input, output, stderr, arguments, and environment values. Review commands, workflows, and lockfiles before allowing default-branch secrets. The workflow uses read-only permissions and creates no output artifact. Scheduled GitHub workflows can be delayed or skipped; use manual dispatch to recover.

## Troubleshooting and upgrades

Run `check --format json` first for config errors. A version error means the installed CLI and `version: 1` config disagree; upgrade the pinned package and lockfile together, then re-run check. Exit 2 during run means inspect your repository command and declared environment locally; raw output is intentionally absent from reports. Fixture cases are safe to run without provider credentials. A failing field type such as `/urgent` expected boolean but got string returns exit 1.

## Established alternatives

- [Promptfoo](https://www.promptfoo.dev/docs/providers/custom-script/) runs evaluations against custom commands and supports [JSON and text assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/deterministic/). It is the closest existing option for this use case.
- [DeepEval](https://deepeval.com/docs/introduction) offers Python-based LLM tests and [CI integration](https://deepeval.com/docs/evaluation-unit-testing-in-ci-cd), including model-graded evaluations.
- [LangSmith](https://docs.langchain.com/langsmith/evaluation-types) provides dataset-based evaluations and experiment tracking for teams that want a hosted evaluation workflow.
- [Braintrust](https://www.braintrust.dev/articles/llm-eval-pipeline-github-actions) supports evaluation pipelines in GitHub Actions with experiment tracking and scoring.

The CLI's niche is a smaller, provider-independent command contract with Git-owned cases and redacted CI results. Teams that need semantic scoring, datasets, or run history should evaluate the tools above first.
