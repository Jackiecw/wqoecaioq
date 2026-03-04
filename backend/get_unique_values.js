const xlsx = require('xlsx');

const p1 = 'd:/Code/internal-site-2/示例数据集/虾皮订单示例.xlsx';
const p2 = 'd:/Code/internal-site-2/示例数据集/TK订单示例.xlsx';

const w1 = xlsx.readFile(p1);
const d1 = xlsx.utils.sheet_to_json(w1.Sheets[w1.SheetNames[0]], { defval: null });

const w2 = xlsx.readFile(p2);
const d2 = xlsx.utils.sheet_to_json(w2.Sheets[w2.SheetNames[0]], { defval: null });

const result = {
    shopee_statuses: [...new Set(d1.map(r => r['Status Pesanan']).filter(Boolean))],
    shopee_cancel_reasons: [...new Set(d1.map(r => r['Alasan Pembatalan']).filter(Boolean))],
    tk_statuses: [...new Set(d2.map(r => r['Order Status']).filter(Boolean))],
    tk_cancel_reasons: [...new Set(d2.map(r => r['Cancel Reason']).filter(Boolean))]
};

console.log(JSON.stringify(result, null, 2));
