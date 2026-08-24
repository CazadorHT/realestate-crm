import React from 'react';
import { 
  Page, 
  Text, 
  View, 
  Document, 
  StyleSheet, 
  Font,
  Image
} from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';

// Register Thai Font (Kanit)
// Note: In a production environment, you should provide the absolute path or URL to the font
const kanitFonts = (() => {
  try {
    const localNormal = path.join(process.cwd(), 'public', 'fonts', 'Kanit-Regular.ttf');
    const localBold = path.join(process.cwd(), 'public', 'fonts', 'Kanit-Bold.ttf');
    if (fs.existsSync(localNormal) && fs.existsSync(localBold)) {
      return [
        { src: localNormal, fontWeight: 400 },
        { src: localBold, fontWeight: 700 },
      ];
    }
  } catch (e) {
    console.error('Kanit font check failed:', e);
  }

  return [
    { src: 'https://fonts.gstatic.com/s/kanit/v15/nK0XWaBzv7DRyLS8_U7M.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/kanit/v15/nK0YWaBzv7DRyLS8bNj-EO7G.ttf', fontWeight: 700 },
  ];
})();

Font.register({ family: 'Kanit', fonts: kanitFonts });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Kanit',
    fontSize: 10,
    color: '#1e293b',
  },
  header: {
    marginBottom: 25,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
    border: '1pt solid #e2e8f0',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#475569',
  },
  value: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    marginTop: 15,
    borderTop: '1pt solid #e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #f1f5f9',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
  },
  cellDesc: { flex: 2 },
  cellAmount: { flex: 1, textAlign: 'right' },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
  },
  totalBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  }
});

export interface WhtTemplateProps {
  data: {
    agentName: string;
    address: string;
    taxAmount: string;
    grossAmount: string;
    netAmount: string;
    date: string;
    tenantName: string;
    referenceCode: string;
    isEn?: boolean;
  };
}

export const WhtCertificateTemplate = ({ data }: WhtTemplateProps) => {
  const isEn = data.isEn ?? false;

  return (
    <Document title={`WHT_Certificate_${data.referenceCode}`}>
      <Page size="A4" style={styles.page}>
        {/* 🏛️ Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEn ? "Withholding Tax Certificate" : "หนังสือรับรองการหักภาษี ณ ที่จ่าย"}
          </Text>
          <Text style={styles.subtitle}>
            {isEn ? "(Under Section 50 Bis of the Thai Revenue Code)" : "(ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร)"}
          </Text>
        </View>

        {/* 🏢 Payor Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isEn ? "Withholding Agent (Payer)" : "ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{isEn ? "Company / Payer:" : "บริษัท/ผู้สั่งจ่าย:"}</Text>
            <Text style={styles.value}>{data.tenantName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{isEn ? "Reference Number:" : "เลขที่เอกสารอ้างอิง:"}</Text>
            <Text style={styles.value}>{data.referenceCode}</Text>
          </View>
        </View>

        {/* 👤 Payee Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isEn ? "Income Recipient (Payee)" : "ผู้ถูกหักภาษี ณ ที่จ่าย"}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{isEn ? "Full Name:" : "ชื่อ-นามสกุล:"}</Text>
            <Text style={styles.value}>{data.agentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{isEn ? "Address:" : "ที่อยู่:"}</Text>
            <Text style={styles.value}>{data.address}</Text>
          </View>
        </View>

        {/* 📊 Payment Details Table */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cellDesc, { paddingLeft: 10 }]}>
            {isEn ? "Income Type" : "ประเภทเงินได้"}
          </Text>
          <Text style={styles.cellAmount}>
            {isEn ? "Gross Amount (THB)" : "จำนวนเงิน (บาท)"}
          </Text>
          <Text style={[styles.cellAmount, { paddingRight: 10 }]}>
            {isEn ? "Tax Withheld (3%)" : "ภาษีที่หัก (3%)"}
          </Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={[styles.cellDesc, { paddingLeft: 10 }]}>
            {isEn ? "Sales Commission / Brokerage Fee" : "ค่าคอมมิชชั่น / ค่านายหน้า"}
          </Text>
          <Text style={styles.cellAmount}>{data.grossAmount} {isEn ? "THB" : "บาท"}</Text>
          <Text style={[styles.cellAmount, { paddingRight: 10 }]}>{data.taxAmount} {isEn ? "THB" : "บาท"}</Text>
        </View>

        {/* 💰 Summary Box */}
        <View style={styles.totalBox}>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>{isEn ? "Net Payout Amount:" : "ยอดเงินจ่ายสุทธิ:"}</Text>
            <Text style={styles.totalValue}>{data.netAmount} {isEn ? "THB" : "บาท"}</Text>
          </View>
        </View>

        {/* ✍️ Signature Area */}
        <View style={styles.footer}>
          <Text>
            {isEn 
              ? "I hereby certify that the above information is true and correct in all respects." 
              : "ขอรับรองว่าข้อความข้างต้นถูกต้องตรงกับความเป็นจริงทุกประการ"}
          </Text>
          <Text style={{ marginTop: 20 }}>
            {isEn ? "Issue Date: " : "วันที่ออกเอกสาร: "}{data.date}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

