import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function convertBelowThousand(number) {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (number < 20) {
    return ones[number];
  }
  if (number < 100) {
    return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ""}`.trim();
  }
  return `${ones[Math.floor(number / 100)]} Hundred${number % 100 ? ` ${convertBelowThousand(number % 100)}` : ""}`.trim();
}

export function convertToWords(number) {
  const value = Number(number);

  if (!value) {
    return "Zero";
  }

  const parts = [];
  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const remainder = value % 1000;

  if (crore) {
    parts.push(`${convertBelowThousand(crore)} Crore`);
  }
  if (lakh) {
    parts.push(`${convertBelowThousand(lakh)} Lakh`);
  }
  if (thousand) {
    parts.push(`${convertBelowThousand(thousand)} Thousand`);
  }
  if (remainder) {
    parts.push(convertBelowThousand(remainder));
  }

  return parts.join(" ").trim();
}

function formatIndianCurrency(amount) {
  return new Intl.NumberFormat("en-IN").format(Number(amount || 0));
}

function formatDate(dateInput, separator = "-") {
  const date = new Date(dateInput);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${separator}${month}${separator}${year}`;
}

function formatDateTime(dateInput) {
  const date = new Date(dateInput);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date, "/")} ${hours}:${minutes}`;
}

function getOrdinalDay(day) {
  const ordinals = [
    "",
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
    "Eleventh",
    "Twelfth",
    "Thirteenth",
    "Fourteenth",
    "Fifteenth",
    "Sixteenth",
    "Seventeenth",
    "Eighteenth",
    "Nineteenth",
    "Twentieth",
    "Twenty-First",
    "Twenty-Second",
    "Twenty-Third",
    "Twenty-Fourth",
    "Twenty-Fifth",
    "Twenty-Sixth",
    "Twenty-Seventh",
    "Twenty-Eighth",
    "Twenty-Ninth",
    "Thirtieth",
    "Thirty-First",
  ];

  return ordinals[day] || String(day);
}

function formatDateInWords(dateInput) {
  const date = new Date(dateInput);
  return {
    dayWord: getOrdinalDay(date.getDate()),
    month: date.toLocaleString("en-IN", { month: "long" }),
    year: date.getFullYear(),
  };
}

function ensureSignatureFont() {
  const existingLink = document.head.querySelector('link[data-landchain-font="dancing-script"]');

  if (!existingLink) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap";
    link.setAttribute("data-landchain-font", "dancing-script");
    document.head.appendChild(link);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSignatureMarkup(name, label, extraLine, signed, timestamp) {
  if (signed) {
    return `
      <div style="font-family:'Dancing Script', cursive; font-size:22px; min-height:60px;">${escapeHtml(name)}</div>
      <hr style="width:160px; margin:8px auto;">
      <div style="font-weight:bold;">${escapeHtml(label)}</div>
      <div>${escapeHtml(extraLine)}</div>
      ${timestamp ? `<div>Signed: ${escapeHtml(formatDateTime(timestamp))}</div>` : ""}
      <div style="color:#065f46; font-weight:bold;">&#10003; Digitally Verified</div>
    `;
  }

  return `
    <div style="width:160px; height:60px; border:1px dashed #999; margin:0 auto 8px; display:flex; align-items:center; justify-content:center; color:#666;">
      Signature Pending
    </div>
    <hr style="width:160px; margin:8px auto;">
    <div style="font-weight:bold;">${escapeHtml(label)}</div>
    <div>${escapeHtml(extraLine)}</div>
  `;
}

function getRiskBadge(level) {
  if (level === "HIGH") {
    return { bg: "#fee2e2", color: "#991b1b" };
  }
  if (level === "MEDIUM") {
    return { bg: "#fef3c7", color: "#92400e" };
  }
  return { bg: "#d1fae5", color: "#065f46" };
}

export async function generateSaleDeed(transfer, signatures) {
  ensureSignatureFont();
  await new Promise((resolve) => setTimeout(resolve, 800));

  const deedContainer = document.createElement("div");
  deedContainer.id = "deed-container";
  deedContainer.style.position = "absolute";
  deedContainer.style.left = "-9999px";
  deedContainer.style.width = "794px";
  deedContainer.style.fontFamily = "Georgia, 'Times New Roman', serif";
  deedContainer.style.background = "white";
  deedContainer.style.color = "black";
  deedContainer.style.border = "3px double #000";
  deedContainer.style.padding = "40px";
  deedContainer.style.boxSizing = "border-box";

  const createdDate = new Date(transfer.createdAt);
  const deedDateWords = formatDateInWords(createdDate);
  const randomDaNumber = String(Math.floor(100000 + Math.random() * 900000));
  const sellerIdSuffix = String(transfer.sellerUserId || "").slice(-4) || "0000";
  const buyerIdSuffix = String(transfer.buyerUserId || "").slice(-4) || "0000";
  const landDetails = transfer.geminiSummary?.landDetails || {};
  const riskBadge = getRiskBadge(transfer.geminiSummary?.riskLevel);
  const previousOwners = (transfer.geminiSummary?.previousOwners || []).join(" -> ");
  const deedSummary = transfer.geminiSummary?.summary || "No AI summary available.";
  const taxStatus = transfer.geminiSummary?.taxStatus || "Not available";
  const deedFlags = Array.isArray(transfer.flags) ? transfer.flags : [];
  const currentDateTime = formatDateTime(new Date());

  const headerHtml = `
    <div style="text-align:center; font-size:24px; font-weight:bold;">SALE DEED</div>
    <div style="text-align:center; font-size:12px; color:#666; margin-top:8px;">
      <div>Generated under LandChain Digital Property Transfer System</div>
      <div>Sub-Registrar Office, Mangaluru District, Karnataka</div>
    </div>
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
    <div style="display:flex; justify-content:space-between; font-size:13px; line-height:1.8;">
      <div>
        <div><strong>Document No:</strong> ${escapeHtml(transfer.transferId)}</div>
        <div><strong>Date:</strong> ${escapeHtml(formatDate(createdDate))}</div>
        <div><strong>ULPIN:</strong> ${escapeHtml(transfer.ulpin)}</div>
      </div>
      <div style="text-align:right;">
        <div><strong>DA</strong> ${randomDaNumber}</div>
        <div>Licensed Stamp Vendor</div>
        <div>Sub-Registrar Office, Mangaluru District</div>
      </div>
    </div>
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
    <div style="text-align:center; font-size:16px; font-weight:bold; text-decoration:underline;">
      SALE DEED FOR &#8377;${formatIndianCurrency(transfer.price)}/- (${escapeHtml(convertToWords(transfer.price))} Only)
    </div>
  `;

  const vendorVendeeHtml = `
    <p style="font-size:13px; line-height:1.9; text-align:justify; margin-top:22px;">
      This Deed of Sale is executed on this ${escapeHtml(deedDateWords.dayWord)} day of ${escapeHtml(deedDateWords.month)} ${escapeHtml(deedDateWords.year)}
      by ${escapeHtml(signatures.seller?.name || transfer.sellerName || transfer.sellerUserId || "Seller")}
      (Aadhaar No. XXXX XXXX ${escapeHtml(sellerIdSuffix)}) S/o. or W/o. Not Specified, hereinafter called the
      <strong> VENDOR </strong> which expression shall wherever it occurs in this deed includes his/her heirs, executors,
      assignees and administrators of one part:
    </p>
    <div style="text-align:center; font-style:italic; font-size:13px; margin:18px 0;">In favour of</div>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">
      ${escapeHtml(signatures.buyer?.name || transfer.buyerName || transfer.buyerUserId || "Buyer")}
      (Aadhaar No. XXXX XXXX ${escapeHtml(buyerIdSuffix)}) S/o. or W/o. Not Specified, hereinafter called the
      <strong> VENDEE </strong> which expression shall wherever it occurs in this deed includes his/her heirs, executors,
      assignees and administrators of the other part:
    </p>
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
  `;

  const propertyAndTermsHtml = `
    <div style="text-align:center; font-weight:bold; text-decoration:underline; margin:12px 0 14px;">SCHEDULE OF PROPERTY</div>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">
      The property bearing ULPIN No. ${escapeHtml(transfer.ulpin)}, Survey No. ${escapeHtml(landDetails.surveyNumber || "N/A")},
      situated at ${escapeHtml(landDetails.location || "N/A")}, measuring ${escapeHtml(landDetails.area || "N/A")},
      classified as ${escapeHtml(landDetails.type || "N/A")} land, as per Revenue Records of Mangaluru District, Karnataka.
    </p>
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
    <div style="text-align:center; font-weight:bold; text-decoration:underline; margin:12px 0 14px;">TERMS AND CONDITIONS</div>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">1. The <strong>VENDOR</strong> agrees to sell and the <strong>VENDEE</strong> agrees to purchase the above property for &#8377;${formatIndianCurrency(transfer.price)}/- (Rupees ${escapeHtml(convertToWords(transfer.price))} only).</p>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">2. The <strong>VENDOR</strong> declares the property is free from all encumbrances, mortgages, liens, attachments, and court proceedings as verified by government records on ${escapeHtml(formatDate(createdDate))}.</p>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">3. The <strong>VENDEE</strong> shall bear all costs of registration, stamp duty, and other incidental charges.</p>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">4. The <strong>VENDOR</strong> shall hand over vacant possession of the property to the <strong>VENDEE</strong> on the date of registration.</p>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">5. This transfer has been verified and approved by the Sub-Registrar, Mangaluru District and Gram Panchayat as per government records.</p>
    <p style="font-size:13px; line-height:1.9; text-align:justify;">6. This deed has been recorded on the LandChain blockchain with Node ID: ${escapeHtml(transfer.blockchainNodeId || "Pending")} as an immutable tamper-proof record.</p>
    ${transfer.agreementConditions ? `<p style="font-size:13px; line-height:1.9; text-align:justify;">7. Additional conditions agreed by both parties: ${escapeHtml(transfer.agreementConditions)}</p>` : ""}
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
  `;

  const aiAndGovHtml = `
    <div style="background:#f5f5f5; border:1px solid #ddd; padding:16px; margin-bottom:16px; font-size:13px; line-height:1.8;">
      <div style="text-align:center; font-weight:bold; margin-bottom:10px;">GEMINI AI VERIFICATION REPORT</div>
      <div>Risk Level:
        <span style="display:inline-block; margin-left:8px; padding:3px 10px; border-radius:999px; background:${riskBadge.bg}; color:${riskBadge.color}; font-weight:bold;">
          ${escapeHtml(transfer.geminiSummary?.riskLevel || "LOW")}
        </span>
      </div>
      <div><strong>Summary:</strong> ${escapeHtml(deedSummary)}</div>
      <div><strong>Previous Owners:</strong> ${escapeHtml(previousOwners)}</div>
      <div><strong>Tax Status:</strong> ${escapeHtml(taxStatus)}</div>
      <div style="margin-top:8px;">
        ${deedFlags.length === 0 ? "No flags or concerns found." : deedFlags.map((flag) => `<div style="color:#92400e;">&#9888; ${escapeHtml(flag)}</div>`).join("")}
      </div>
    </div>
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
    <div style="text-align:center; font-weight:bold; text-decoration:underline; margin:12px 0 14px;">GOVERNMENT APPROVALS</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
      <div style="border:1px solid #333; padding:16px; font-size:13px; line-height:1.8;">
        <div style="font-weight:bold;">SUB-REGISTRAR APPROVAL</div>
        <div>Status: &#10003; Approved</div>
        <div>Approved on: ${escapeHtml(transfer.registrarAction?.timestamp ? formatDateTime(transfer.registrarAction.timestamp) : "Pending")}</div>
        <div>Office: Sub-Registrar, Mangaluru District</div>
        <div style="margin-top:12px; text-align:center;">
          ${signatures.registrar?.signed ? `
            <div style="font-family:'Dancing Script', cursive; font-size:22px;">${escapeHtml(signatures.registrar.name || "Registrar")}</div>
            <hr style="width:180px;">
            <div>Sub-Registrar, Mangaluru District</div>
            <div>&#128274; Digitally Signed</div>
          ` : `
            <div style="width:180px; height:60px; border:1px dashed #999; margin:0 auto; display:flex; align-items:center; justify-content:center; color:#666;">
              Signature Pending
            </div>
          `}
        </div>
      </div>
      <div style="border:1px solid #333; padding:16px; font-size:13px; line-height:1.8;">
        <div style="font-weight:bold;">PANCHAYAT APPROVAL</div>
        <div>Status: &#10003; Approved</div>
        <div>Approved on: ${escapeHtml(transfer.panchayatAction?.timestamp ? formatDateTime(transfer.panchayatAction.timestamp) : "Pending")}</div>
        <div>Office: Gram Panchayat, Mangaluru</div>
        <div style="margin-top:12px; text-align:center;">
          ${signatures.panchayat?.signed ? `
            <div style="font-family:'Dancing Script', cursive; font-size:22px;">${escapeHtml(signatures.panchayat.name || "Panchayat Officer")}</div>
            <hr style="width:180px;">
            <div>Panchayat Officer, Mangaluru</div>
            <div>&#128274; Digitally Signed</div>
          ` : `
            <div style="width:180px; height:60px; border:1px dashed #999; margin:0 auto; display:flex; align-items:center; justify-content:center; color:#666;">
              Signature Pending
            </div>
          `}
        </div>
      </div>
    </div>
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
  `;

  const signaturesAndFooterHtml = `
    <div style="text-align:center; font-weight:bold; text-decoration:underline; margin:12px 0 18px;">PARTY SIGNATURES</div>
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; text-align:center; font-size:13px; line-height:1.8;">
      <div>
        ${buildSignatureMarkup(
          signatures.buyer?.name || transfer.buyerName || transfer.buyerUserId || "Buyer",
          "VENDEE",
          transfer.buyerUserId || "",
          Boolean(signatures.buyer?.signed),
          signatures.buyer?.timestamp
        )}
      </div>
      <div>
        ${buildSignatureMarkup(
          signatures.seller?.name || transfer.sellerName || transfer.sellerUserId || "Seller",
          "VENDOR",
          transfer.sellerUserId || "",
          Boolean(signatures.seller?.signed),
          signatures.seller?.timestamp
        )}
      </div>
      <div>
        <div style="font-family:'Dancing Script', cursive; font-size:22px; min-height:60px;">Rajesh Shetty</div>
        <hr style="width:160px; margin:8px auto;">
        <div style="font-weight:bold;">WITNESS 1</div>
        <div>Mangaluru, Karnataka</div>
      </div>
      <div>
        <div style="font-family:'Dancing Script', cursive; font-size:22px; min-height:60px;">Priya Nair</div>
        <hr style="width:160px; margin:8px auto;">
        <div style="font-weight:bold;">WITNESS 2</div>
        <div>Mangaluru, Karnataka</div>
      </div>
    </div>
    <hr style="margin:18px 0; border:none; border-top:1px solid #bbb;">
    <div style="text-align:center; font-size:10px; color:#666; line-height:1.8;">
      <div>This is a digitally generated Sale Deed under the LandChain Digital Property Transfer System.</div>
      <div>Blockchain Record: ${escapeHtml(transfer.blockchainNodeId || "Pending")}</div>
      <div>Generated on: ${escapeHtml(currentDateTime)}</div>
      <div>Verify at: landchain.gov.in/verify/${escapeHtml(transfer.ulpin || "")}</div>
    </div>
  `;

  deedContainer.innerHTML = `${headerHtml}${vendorVendeeHtml}${propertyAndTermsHtml}${aiAndGovHtml}${signaturesAndFooterHtml}`;

  document.body.appendChild(deedContainer);

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const canvas = await html2canvas(deedContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/png");

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(`LandChain_SaleDeed_${transfer.ulpin}_${transfer.transferId}.pdf`);
    return true;
  } finally {
    if (document.body.contains(deedContainer)) {
      document.body.removeChild(deedContainer);
    }
  }
}
