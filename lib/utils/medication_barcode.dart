import 'package:uuid/uuid.dart';

const _uuid = Uuid();

String generateManualBarcode() => 'manual_${_uuid.v4()}';
