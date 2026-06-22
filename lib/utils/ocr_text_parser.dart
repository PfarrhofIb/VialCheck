class OcrTextParser {
  OcrTextParser._();

  static final _expiryPatterns = [
    RegExp(r'\b(\d{2})[./](\d{2,4})\b'),
    RegExp(r'\b(\d{2})\.(\d{2})\.(\d{4})\b'),
    RegExp(r'(?:17)(\d{6})'),
    RegExp(r'(?:MHD|EXP|Verf|Abl)[:\s]*(\d{2})[./](\d{2,4})', caseSensitive: false),
  ];

  static final _noisePattern = RegExp(r'^[\d\s\W]+$');
  static final _lotPattern = RegExp(r'^(LOT|CH|BN|SN|PZN|GTIN)', caseSensitive: false);

  static final _medKeywords = RegExp(
    r'adrenalin|noradrenalin|amiodaron|atropin|lidocain|morphin|fentanyl|'
    r'midazolam|ketamin|etomidat|sufentanil|rocuronium|succinylcholin|'
    r'heparin|aspirin|glucose|tramadol|metamizol|paracetamol|ibuprofen|'
    r'diazepam|lorazepam|salbutamol|epinephrin|insulin|dexamethason|'
    r'hydrocortison|naloxon|flumazenil|calcium|magnesium|natrium|'
    r'kalium|ringers|kochsalz|gelafundin|tranexamsäure|tranexamsaeure',
    caseSensitive: false,
  );

  static String? suggestMedicationName(String rawText) {
    final lines = rawText
        .split(RegExp(r'[\n\r]+'))
        .map((l) => l.trim())
        .where((l) => l.length >= 3)
        .toList();

    if (lines.isEmpty) return null;

    for (final line in lines) {
      if (_medKeywords.hasMatch(line) && !_noisePattern.hasMatch(line)) {
        return _cleanName(line);
      }
    }

    final candidates = lines
        .where((l) => RegExp(r'[A-Za-zÄÖÜäöüß]{3,}').hasMatch(l))
        .where((l) => !_noisePattern.hasMatch(l))
        .where((l) => !_lotPattern.hasMatch(l))
        .where((l) => !RegExp(r'^\d').hasMatch(l))
        .toList();

    if (candidates.isEmpty) return null;

    candidates.sort((a, b) => b.length.compareTo(a.length));
    return _cleanName(candidates.first);
  }

  static DateTime? suggestExpiryDate(String rawText) {
    for (final pattern in _expiryPatterns) {
      final match = pattern.firstMatch(rawText);
      if (match == null) continue;

      if (match.groupCount == 1 && pattern.pattern.contains('17')) {
        final gs1 = match.group(1)!;
        if (gs1.length == 6) {
          return _parseGs1MonthYear(gs1);
        }
      }

      if (match.groupCount == 2) {
        final month = int.tryParse(match.group(1)!);
        var year = int.tryParse(match.group(2)!);
        if (month == null || year == null || month < 1 || month > 12) continue;
        if (year < 100) year += 2000;
        return DateTime(year, month);
      }

      if (match.groupCount >= 3) {
        final month = int.tryParse(match.group(2)!);
        var year = int.tryParse(match.group(3)!);
        if (month == null || year == null || month < 1 || month > 12) continue;
        if (year < 100) year += 2000;
        return DateTime(year, month);
      }
    }
    return null;
  }

  static DateTime? _parseGs1MonthYear(String yymmdd) {
    final year = 2000 + int.parse(yymmdd.substring(0, 2));
    final month = int.parse(yymmdd.substring(2, 4));
    if (month < 1 || month > 12) return null;
    return DateTime(year, month);
  }

  static String _cleanName(String value) {
    return value.replaceAll(RegExp(r'\s+'), ' ').trim();
  }
}
