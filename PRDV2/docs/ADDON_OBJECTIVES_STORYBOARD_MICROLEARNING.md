# PRD Add-on — Objective notes + Storyboards + Microlearning

Date: 2026-01-03
Applies to: PRD v0.2

## Summary

This add-on formalizes learning objectives as first-class notes and adds two content artifact types (`storyboard`, `microlearning_unit`) to support systematic educational content generation.

## Why objectives are first-class

Objectives act as canonical join keys. Content generation runs start from an objective ID and deterministically retrieve aligned concepts, procedures, misconceptions, activities, and assessments.

## New vault folders

- `vault/objectives/`
- `vault/storyboards/`
- `vault/microlearning/`

## New note types

### learning_objective

Minimal requirements:
- observable definition
- mastery criteria (testable)
- common misconceptions
- links to prerequisite concepts

### storyboard

Minimal requirements:
- links to exactly one primary objective
- numbered beats; each beat links to at least one concept/procedure/misconception
- “assets to generate” list

### microlearning_unit

Minimal requirements:
- links to exactly one primary objective
- hook → core idea → quick check → tiny practice
- links to supporting concepts/procedures

## New link semantics

- `primary_objective`: every content artifact must declare exactly one primary objective
- `practices_objective`: activities and microlearning explicitly practice an objective
- `supports_objective`: concepts/procedures/principles/stories support an objective
- `assesses`: assessments assess an objective (and optionally a concept)

## QA gates (recommended)

- Every `storyboard` beat includes at least one resolved wikilink.
- Every `microlearning_unit` has exactly one objective link and includes a “Quick check” section.
- Every `assessment_item` links to at least one objective via `assesses`.
- Every generated content note includes a retrieval provenance field (list of note IDs used).

## Generator contract

Given `objective-*.md`, the generator produces a pack:
- story + storyboard + microlearning unit
- one activity + 3–5 assessment items
All artifacts must link back to the objective and to the concepts/procedures they use.
