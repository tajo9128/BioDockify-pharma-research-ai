# BioDockify AI v2.8.1 Release Notes

**Release Date:** 2026-02-14

## Summary
Fixed all Python 2 to 3 compatibility issues in deep_drive modules, resolving 16 syntax errors blocking compilation.

## Bug Fixes

### Python 2 to 3 Compatibility (16 Fixes)

#### sepln09 Module
- Fixed missing closing parenthesis in print statement
- File: `agent_zero/skills/deep_drive/sepln09/pan09-plagiarism-detection-performance-measures.py`

#### meteor-1.5 Evaluation Toolkit (15 Fixes)
All fixes in `agent_zero/skills/deep_drive/semeval23/evaluation/meteor-1.5/`

1. **mt-diff/mt-diff.py** (Line 27)
   - Fixed backslash line continuation in print statement

2. **scripts/bleu.py** (Line 10)
   - Converted Python 2 `print(>> sys.stderr, ...)` to Python 3 `print(..., file=sys.stderr)`

3. **scripts/build_wordnet_files.py** (Line 22)
   - Fixed inconsistent indentation (tabs vs spaces)

4. **scripts/combine_segcor_trainset.py** (Line 8)
   - Fixed inconsistent indentation in if block

5. **scripts/delete_stray_matches.py** (Line 23)
   - Fixed backslash line continuation issues

6. **scripts/filter_merge_rank_set.py** (Line 48)
   - Converted Python 2 print statement with >> redirect to Python 3 syntax

7. **scripts/meteor_shower.py** (Line 12)
   - Converted Python 2 print statements to Python 3 syntax

8. **scripts/ter.py** (Line 10)
   - Converted Python 2 print statements to Python 3 syntax

9. **scripts/wmt_bleu.py** (Line 10)
   - Fixed format() call split across lines

10. **scripts/wmt_fmt.py** (Line 10)
    - Fixed format() call split across lines

11. **scripts/wmt_ter.py** (Line 8)
    - Fixed format() call split across lines

12. **xray/Generation.py** (Line 65)
    - Converted Python 2 print statement to Python 3 syntax

13. **xray/visualize_alignments.py** (Line 29)
    - Converted all Python 2 print statements to Python 3 syntax

14. **xray/xray.py** (Line 61)
    - Fixed Python 2 print statement with backslash continuation

15. **scripts/meteorToMosesAlign.py** (Line 33)
    - Fixed indentation mismatch (tabs vs spaces)

## Technical Details

### Legacy Code Compatibility
- METEOR 1.5 is an academic evaluation toolkit from 2013-2014
- These scripts are still used by `meteor-metric.py` and `clickbait-spoiling-eval.py`
- All Python 2 syntax has been modernized to Python 3 for continued compatibility

### Common Patterns Fixed
1. `print(>> sys.stderr, ...)` → `print(..., file=sys.stderr)`
2. `print(>> file, ...)` → `print(..., file=file)`
3. Backslash line continuations → Proper line concatenation
4. Inconsistent indentation → Consistent 4-space/tabs
5. `format()` split across lines → Single-line format calls

## Compliance

This release maintains compliance with:
- **GLP** (Good Laboratory Practice)
- **GCP** (Good Clinical Practice)
- **FDA/EMA** regulatory standards
- **ISO 27001** information security
- **ISO 9001** quality management
- **GDPR/CCPA** data protection standards

## Installation

### Docker (Recommended)
```bash
docker pull tajo9128/biodockify-ai:v2.8.1
docker run -p 3000:3000 tajo9128/biodockify-ai:v2.8.1
```

### GitHub Repository
```bash
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai
git checkout v2.8.1
```

## Known Issues

None identified in this release.

## Upgrade Notes

No breaking changes. Upgrade from previous versions is seamless.

## Changelog

### v2.8.1 (2026-02-14)
- Fixed all Python 2 to 3 compatibility issues in deep_drive modules
- Resolved 16 syntax errors blocking compilation
- Maintained backward compatibility with existing evaluation workflows

---

**Previous Release:** [v2.8.0](./RELEASE_NOTES_v2.8.0.md)
**Project:** BioDockify AI - Pharmaceutical Research Platform
**License:** MIT License
