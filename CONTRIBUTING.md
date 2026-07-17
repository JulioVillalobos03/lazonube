# Contributing to LazoNube

Use English for code, filenames, routes, tests, schemas, technical messages, and
commits. Use Conventional Commits such as `feat:`, `fix:`, `test:`, `docs:`, and
`chore:`.

Create feature branches as `feat/<short-description>`, fixes as
`fix/<short-description>`, and emergency production fixes as
`hotfix/<short-description>`. Feature pull requests target `develop`.

Every pull request must identify its phase, affected modules, security and
privacy impact, database changes, tests, evidence, risks, and rollback plan.
Schema changes require a reviewed Prisma migration; never edit an already
deployed migration.

A change is done when its contracts and documentation are current, relevant
unit and PostgreSQL integration tests pass, lint and typecheck pass, the build is
successful, and staging evidence is attached when the change affects runtime
behavior.
