import { PrismaClient } from "@prisma/client";
import { CURATED_LEGAL_DOCUMENTS } from "../src/lib/legal/legal-data";

const prisma = new PrismaClient();

async function main() {
  console.log("⚖️ Bắt đầu gieo CSDL Căn cứ Pháp lý (TASK-210)...");
  console.log(`- Tổng số văn bản quy chuẩn cần nạp: ${CURATED_LEGAL_DOCUMENTS.length}`);

  let insertedCount = 0;

  for (const doc of CURATED_LEGAL_DOCUMENTS) {
    const existing = await prisma.legalDocument.findFirst({
      where: { docCode: doc.docCode },
    });

    if (!existing) {
      await prisma.legalDocument.create({
        data: {
          docCode: doc.docCode,
          title: doc.title,
          docType: doc.docType,
          issuingAuthority: doc.issuingAuthority,
          issuedDate: new Date(doc.issuedDate),
          effectiveDate: new Date(doc.effectiveDate),
          status: doc.status,
          fullCitation: doc.fullCitation,
          categoryId: doc.categoryId,
        },
      });
      insertedCount++;
    }
  }

  console.log(`✓ Đã nạp thành công ${insertedCount} văn bản pháp quy mới vào bảng legal_documents!`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed legal documents:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
