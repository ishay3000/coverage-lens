#!/usr/bin/env python3
"""
Convert Cobertura XML coverage report(s) to the compact Coverage Lens JSON format.

Usage:
  python xml-to-json.py <input.xml> <output.json> [--pr-files file1 file2 ...]
  python xml-to-json.py <input_dir> <output.json> [--pr-files-from <path>]

The output format (coverage-lens/v1):
  {
    "format": "coverage-lens/v1",
    "files": {
      "path/to/file": { "lineNum": hits, ... },
      ...
    }
  }
"""

import json
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def normalize_path(p: str) -> str:
    return p.replace("\\", "/").lstrip("/")


def parse_cobertura_xml(xml_path: str) -> dict[str, dict[str, int]]:
    tree = ET.parse(xml_path)
    root = tree.getroot()
    files: dict[str, dict[str, int]] = {}

    for cls in root.iter("class"):
        filename = cls.get("filename")
        if not filename:
            continue
        filename = normalize_path(filename)

        lines_data = files.get(filename, {})
        for line in cls.iter("line"):
            num = line.get("number")
            hits = line.get("hits")
            if num is None or hits is None:
                continue
            lines_data[num] = int(hits)
        if lines_data:
            files[filename] = lines_data

    return files


def filter_by_pr_files(
    files: dict[str, dict[str, int]], pr_files: list[str]
) -> dict[str, dict[str, int]]:
    """Keep only coverage entries whose path suffix-matches a PR file."""
    pr_normalized = [normalize_path(f) for f in pr_files if f.strip()]
    if not pr_normalized:
        return files

    filtered = {}
    for cov_path, lines in files.items():
        norm_cov = normalize_path(cov_path)
        for pr_path in pr_normalized:
            if (
                norm_cov == pr_path
                or norm_cov.endswith("/" + pr_path)
                or pr_path.endswith("/" + norm_cov)
            ):
                filtered[cov_path] = lines
                break
    return filtered


def find_xml_files(path: str) -> list[str]:
    p = Path(path)
    if p.is_file():
        return [str(p)]
    if p.is_dir():
        return sorted(str(f) for f in p.rglob("*.xml"))
    return []


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)

    input_path = args[0]
    output_path = args[1]

    pr_files: list[str] = []
    i = 2
    while i < len(args):
        if args[i] == "--pr-files":
            i += 1
            while i < len(args) and not args[i].startswith("--"):
                pr_files.append(args[i])
                i += 1
        elif args[i] == "--pr-files-from":
            i += 1
            if i < len(args):
                with open(args[i]) as f:
                    pr_files.extend(
                        line.strip() for line in f if line.strip()
                    )
                i += 1
        else:
            i += 1

    xml_files = find_xml_files(input_path)
    if not xml_files:
        print(f"Error: no XML files found at {input_path}", file=sys.stderr)
        sys.exit(1)

    all_files: dict[str, dict[str, int]] = {}
    for xml_file in xml_files:
        parsed = parse_cobertura_xml(xml_file)
        for path, lines in parsed.items():
            if path in all_files:
                existing = all_files[path]
                for num, hits in lines.items():
                    existing[num] = existing.get(num, 0) + hits
            else:
                all_files[path] = dict(lines)

    if pr_files:
        all_files = filter_by_pr_files(all_files, pr_files)

    output = {"format": "coverage-lens/v1", "files": all_files}

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    file_count = len(all_files)
    line_count = sum(len(v) for v in all_files.values())
    size_kb = os.path.getsize(output_path) / 1024
    print(f"Converted {len(xml_files)} XML file(s) -> {output_path}")
    print(f"  {file_count} files, {line_count} lines, {size_kb:.1f} KB")
    if pr_files:
        print(f"  Filtered to {len(pr_files)} PR files")


if __name__ == "__main__":
    main()
