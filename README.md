# Climp: Powerful and lightweight argument parsing

Climp (_**CLI**, **M**uch **P**owerful_) is a generic argument parser for creating command-line interfaces.
The original need for Climp was to support **extendable** CLIs:
The ability to create a CLI where you can run it with `--load plugin.js pull` and the `pull` command would be defined by the loaded plugin.
Most argument parsers require you to define the full interface in advance and supports these type of dynamic options quite poorly.

## Current status

Climp is under initial development.
