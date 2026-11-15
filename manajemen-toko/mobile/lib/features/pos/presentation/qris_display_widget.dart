import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/utils/currency_formatter.dart';

/// Widget tampilan QRIS Toko beresolusi tinggi (tajam di layar Retina iPhone/iPad)
/// agar pembeli dapat langsung scan menggunakan m-Banking atau e-Wallet.
class QrisDisplayWidget extends StatelessWidget {
  final int amount;
  final String storeName;
  final String qrisData;

  const QrisDisplayWidget({
    super.key,
    required this.amount,
    this.storeName = 'TOKO BERKAH JAYA',
    this.qrisData = '00020101021126580014ID.CO.QRIS.WWW011893600914300000000002152026111500000010303UMI51440014ID.CO.QRIS.WWW0215ID10260000000010303UMI5204541153033605802ID5916TOKO BERKAH JAYA6007JAKARTA6105101106304ABCD',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.qr_code_2, color: Color(0xFF059669), size: 20),
              const SizedBox(width: 6),
              Text(
                'QRIS • $storeName',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            child: QrImageView(
              data: qrisData,
              version: QrVersions.auto,
              size: 160,
              backgroundColor: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Nominal Bayar: ${CurrencyFormatter.formatRupiah(amount)}',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              color: Color(0xFF059669),
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            'Arahkan kamera m-Banking / e-Wallet pembeli ke kode QR',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}
