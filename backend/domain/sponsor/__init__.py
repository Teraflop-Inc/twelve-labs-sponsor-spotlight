"""Sponsor-exposure domain: the JSON schemas and prompts we send to Jockey.

The whole Jockey contract lives in two files:

- :mod:`domain.sponsor.schemas` — the ``json_schema`` passed to ``/responses``,
  one per analysis pass. This is what forces Jockey to answer in a shape we can
  compute on.
- :mod:`domain.sponsor.prompts` — the instructions and user messages, including
  the per-game ``selections`` / ``{{sel:N}}`` scoping trick.

Everything else (services, routes) is plumbing around these two.
"""
