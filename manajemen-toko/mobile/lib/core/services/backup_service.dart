import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../database/app_database.dart';

class BackupService {
  static final BackupService instance = BackupService._init();
  BackupService._init();

  /// Buat file JSON backup seluruh data toko dan kembalikan path-nya
  Future<File> createBackupFile() async {
    final data = await AppDatabase.instance.exportFullBackupData();
    final jsonString = const JsonEncoder.withIndent('  ').convert(data);
    final dir = await getTemporaryDirectory();
    final now = DateTime.now();
    final stamp =
        '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}_${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}';
    final file = File('${dir.path}/backup_kasirku_$stamp.json');
    return await file.writeAsString(jsonString, flush: true);
  }

  /// Ekspor backup lokal ke .json lalu buka Share Sheet (Google Drive / WhatsApp / Files)
  Future<void> exportAndShareBackup() async {
    final file = await createBackupFile();
    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(file.path, mimeType: 'application/json')],
        text: 'Backup Data Toko Kasirku (${DateTime.now().toLocal()})',
      ),
    );
  }

  /// Pulihkan database dari string JSON backup
  Future<int> restoreFromJsonString(String jsonString) async {
    final decoded = jsonDecode(jsonString);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Isi file backup bukan objek JSON yang valid.');
    }
    await AppDatabase.instance.restoreFullBackupData(decoded);

    final tables = decoded['tables'] as Map<String, dynamic>? ?? {};
    final productCount = (tables['products'] as List?)?.length ?? 0;
    return productCount;
  }

  /// Buka pemilih file (.json) lalu pulihkan data toko
  Future<int?> pickAndRestoreBackup() async {
    final files = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );
    if (files.isEmpty) return null;

    final filePath = files.single.path;
    if (filePath == null) return null;

    final content = await File(filePath).readAsString();
    return await restoreFromJsonString(content);
  }
}
