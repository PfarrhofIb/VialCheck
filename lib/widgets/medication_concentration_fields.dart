import 'package:flutter/material.dart';

import '../utils/number_parse_utils.dart';

class MedicationConcentrationFields extends StatelessWidget {
  const MedicationConcentrationFields({
    super.key,
    required this.mlController,
    required this.mgPerMlController,
  });

  final TextEditingController mlController;
  final TextEditingController mgPerMlController;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextFormField(
            controller: mlController,
            decoration: const InputDecoration(
              labelText: 'ml pro Ampulle',
              hintText: 'z. B. 2',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: _optionalNumberValidator,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TextFormField(
            controller: mgPerMlController,
            decoration: const InputDecoration(
              labelText: 'mg pro ml',
              hintText: 'z. B. 1',
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: _optionalNumberValidator,
          ),
        ),
      ],
    );
  }

  static String? _optionalNumberValidator(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    if (NumberParseUtils.parseOptionalDouble(value) == null) {
      return 'Ungültige Zahl';
    }
    return null;
  }
}
