/* ============================================================
   Peacock QuoteDesk — calculations, formatting, amount in words
   ============================================================ */

function fmtMoney(n, cur){
  if (isNaN(n)) return '—';
  n = Math.round(n);   // whole units, deterministic — matches amountInWords (also rounds)
  return n.toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US', { maximumFractionDigits: 0 });
}

function curSymbol(cur){ return cur === 'INR' ? '₹' : '$'; }

/* -- number to words -- */
function words2(n){ // 0-99
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (n < 20) return ones[n];
  return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
}
function words3(n){ // 0-999
  return (n >= 100 ? words2(Math.floor(n/100)) + ' Hundred' + (n%100 ? ' ' : '') : '') + (n%100 ? words2(n%100) : '');
}
function inWordsINR(n){
  n = Math.round(n); if (n === 0) return 'Zero';
  const out = [];
  const cr = Math.floor(n/10000000); n %= 10000000;
  const lk = Math.floor(n/100000);  n %= 100000;
  const th = Math.floor(n/1000);    n %= 1000;
  if (cr) out.push(words3(cr) + ' Crore');
  if (lk) out.push(words2(lk) + ' Lakh');
  if (th) out.push(words2(th) + ' Thousand');
  if (n)  out.push(words3(n));
  return out.join(' ');
}
function inWordsUSD(n){
  n = Math.round(n); if (n === 0) return 'Zero';
  const out = [];
  const m  = Math.floor(n/1000000); n %= 1000000;
  const th = Math.floor(n/1000);    n %= 1000;
  if (m)  out.push(words3(m) + ' Million');
  if (th) out.push(words3(th) + ' Thousand');
  if (n)  out.push(words3(n));
  return out.join(' ');
}
function amountInWords(total, cur){
  if (!(total > 0)) return '';
  return cur === 'INR'
    ? 'Rupees ' + inWordsINR(total) + ' Only'
    : 'US Dollars ' + inWordsUSD(total) + ' Only';
}

/* -- totals --
   sub  = taxable cost lines
   gst  = charged only when gstEnabled
   post = additional charges that are NEVER taxed (added after GST)
   total = sub + gst + post */
function sumAmounts(list){
  let s = 0;
  (list || []).forEach(c => { s += Math.max(0, parseFloat(c.amount) || 0); });   // negatives never reduce the total
  return s;
}
function computeTotals(costs, gstEnabled, gstRate, postCosts){
  const sub = sumAmounts(costs);
  const gst = gstEnabled ? sub * (parseFloat(gstRate) || 0) / 100 : 0;
  const post = sumAmounts(postCosts);
  return { sub, gst, post, total: sub + gst + post };
}
function computeOptionTotals(option, commonCosts, gstEnabled, gstRate, postCosts){
  const sub = Math.max(0, parseFloat(option.price) || 0) + sumAmounts(commonCosts);
  const gst = gstEnabled ? sub * (parseFloat(gstRate) || 0) / 100 : 0;
  const post = sumAmounts(postCosts);
  return { sub, gst, post, total: sub + gst + post };
}

function fmtDateDisplay(d){
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(s){
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
