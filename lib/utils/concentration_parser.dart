import '../utils/number_parse_utils.dart';

class ConcentrationInfo {
  const ConcentrationInfo({this.mlPerAmpule, this.mgPerMl});

  final double? mlPerAmpule;
  final double? mgPerMl;
}

class ConcentrationParser {
  ConcentrationParser._();

  static final _mgPerMlPattern = RegExp(
    r'(\d+(?:[.,]\d+)?)\s*(?:mg|mcg|µg|ug)\s*/\s*ml',
    caseSensitive: false,
  );

  static final _ratioPattern = RegExp(
    r'(\d+)\s*:\s*(\d+)',
    caseSensitive: false,
  );

  static final _mlAmpulePattern = RegExp(
    r'(\d+(?:[.,]\d+)?)\s*ml\b',
    caseSensitive: false,
  );

  static ConcentrationInfo parse(String rawText) {
    double? mgPerMl;
    double? mlPerAmpule;

    final mgMatch = _mgPerMlPattern.firstMatch(rawText);
    if (mgMatch != null) {
      mgPerMl = NumberParseUtils.parseOptionalDouble(mgMatch.group(1));
    } else {
      final ratio = _ratioPattern.firstMatch(rawText);
      if (ratio != null) {
        final a = int.tryParse(ratio.group(1)!);
        final b = int.tryParse(ratio.group(2)!);
        if (a != null && b != null && b > 0) {
          mgPerMl = a / b;
        }
      }
    }

    for (final match in _mlAmpulePattern.allMatches(rawText)) {
      final value = NumberParseUtils.parseOptionalDouble(match.group(1));
      if (value != null && value <= 50) {
        mlPerAmpule = value;
        break;
      }
    }

    return ConcentrationInfo(mlPerAmpule: mlPerAmpule, mgPerMl: mgPerMl);
  }

  static String? formatLabel(double? mlPerAmpule, double? mgPerMl) {
    final parts = <String>[];
    if (mlPerAmpule != null) {
      parts.add('${NumberParseUtils.formatOptionalDouble(mlPerAmpule)} ml/Amp.');
    }
    if (mgPerMl != null) {
      parts.add('${NumberParseUtils.formatOptionalDouble(mgPerMl)} mg/ml');
    }
    if (parts.isEmpty) return null;
    return parts.join(' · ');
  }
}
