class NumberParseUtils {
  NumberParseUtils._();

  static double? parseOptionalDouble(String? value) {
    if (value == null) return null;
    final trimmed = value.trim().replaceAll(',', '.');
    if (trimmed.isEmpty) return null;
    return double.tryParse(trimmed);
  }

  static String? formatOptionalDouble(double? value) {
    if (value == null) return null;
    if (value == value.roundToDouble()) {
      return value.toInt().toString();
    }
    return value.toString().replaceAll('.', ',');
  }
}
