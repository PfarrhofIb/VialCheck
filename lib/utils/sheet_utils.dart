import 'package:flutter/material.dart';

Widget sheetSafePadding({
  required BuildContext context,
  required Widget child,
}) {
  return Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
    child: SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
        child: child,
      ),
    ),
  );
}
